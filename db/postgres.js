'use strict';

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure it in the runtime environment before starting SkillSpace.');
}

const isLocal = /^(localhost|127\.0\.0\.1|::1)(:\d+)?$/i.test(
  (() => { try { return new URL(connectionString).host; } catch { return ''; } })()
);
const sslDisabled = String(process.env.PGSSLMODE || '').toLowerCase() === 'disable';

const pool = new Pool({
  connectionString,
  ssl: sslDisabled || isLocal ? false : { rejectUnauthorized: false },
  max: Math.max(1, Math.min(Number.parseInt(process.env.PG_POOL_MAX || '5', 10) || 5, 20)),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  query_timeout: 20_000,
  statement_timeout: 20_000,
  application_name: 'skillspace-api'
});

// Do not log connection strings, query parameters, or credential-bearing errors.
pool.on('error', () => {
  console.error('[database] An idle PostgreSQL client emitted an error.');
});

async function query(text, values = []) {
  return pool.query(text, values);
}

async function one(text, values = []) {
  const result = await query(text, values);
  return result.rows[0] || null;
}

async function many(text, values = []) {
  const result = await query(text, values);
  return result.rows;
}

async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work({
      query: (sql, values = []) => client.query(sql, values),
      one: async (sql, values = []) => {
        const result = await client.query(sql, values);
        return result.rows[0] || null;
      },
      many: async (sql, values = []) => {
        const result = await client.query(sql, values);
        return result.rows;
      }
    });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve the original error */ }
    throw error;
  } finally {
    client.release();
  }
}

const REQUIRED_TABLES = Object.freeze([
  'users', 'creator_profiles', 'client_profiles', 'hiring_requests',
  'community_posts', 'community_messages', 'meetings', 'assurance_projects',
  'project_requirements', 'project_milestones', 'project_scope_checks',
  'project_submissions', 'blueprint_revisions', 'project_reviews',
  'project_feedback', 'assurance_notifications', 'creator_payment_methods',
  'milestone_payments', 'payment_documents', 'notification_reads',
  'global_chat_messages', 'dm_invites', 'dm_conversations', 'dm_messages',
  'testimonials', 'user_bans', 'user_reports'
]);

async function checkRequiredTables() {
  const rows = await many(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
        AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );
  const found = new Set(rows.map(row => row.table_name));
  const missing = REQUIRED_TABLES.filter(name => !found.has(name));
  return { ok: missing.length === 0, expected: REQUIRED_TABLES.length, found: found.size, missing };
}


const REQUIRED_ID_TABLES = Object.freeze(REQUIRED_TABLES.filter(name => !['notification_reads', 'creator_payment_methods', 'user_bans'].includes(name)));

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function checkGeneratedIdDefaults() {
  const rows = await many(
    `SELECT table_name, column_default, is_identity,
            pg_get_serial_sequence(format('%I.%I', current_schema(), table_name), 'id') AS sequence_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND column_name = 'id'
        AND table_name = ANY($1::text[])`,
    [REQUIRED_ID_TABLES]
  );
  const schemaRow = await one('SELECT current_schema() AS schema_name');
  const currentSchemaName = schemaRow?.schema_name || 'public';
  const byTable = new Map(rows.map(row => [row.table_name, row]));
  const missing = [];
  const sequenceBehind = [];
  for (const table of REQUIRED_ID_TABLES) {
    const column = byTable.get(table);
    if (!column || (!column.column_default && column.is_identity !== 'YES')) {
      missing.push(table);
      continue;
    }
    if (!column.sequence_name) continue;
    const [schemaName, sequenceName] = column.sequence_name.split('.').map(part => part.replace(/^"|"$/g, '').replace(/""/g, '"'));
    if (!schemaName || !sequenceName) continue;
    const sequence = await one(`SELECT last_value, is_called FROM ${quoteIdentifier(schemaName)}.${quoteIdentifier(sequenceName)}`);
    const maxRow = await one(`SELECT COALESCE(MAX(id), 0)::bigint AS max_id FROM ${quoteIdentifier(currentSchemaName)}.${quoteIdentifier(table)}`);
    const lastValue = sequence?.last_value == null ? 0n : BigInt(sequence.last_value);
    const maxId = BigInt(maxRow?.max_id || 0);
    const isCalled = Boolean(sequence?.is_called);
    if ((!isCalled && lastValue <= maxId) || (isCalled && lastValue < maxId)) {
      sequenceBehind.push({ table, lastValue: String(lastValue), maxId: String(maxId), isCalled });
    }
  }
  return { ok: missing.length === 0 && sequenceBehind.length === 0, expected: REQUIRED_ID_TABLES.length, checked: rows.length, missing, sequenceBehind };
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, one, many, transaction, checkRequiredTables, checkGeneratedIdDefaults, close, REQUIRED_TABLES, REQUIRED_ID_TABLES };
