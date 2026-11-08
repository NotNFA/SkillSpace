'use strict';

async function main() {
  const pg = require('../db/postgres');
  try {
    await pg.one('SELECT 1 AS connected');
    console.log('PASS: PostgreSQL connection established.');
    const tables = await pg.checkRequiredTables();
    console.log(`Required tables: ${tables.found}/${tables.expected}`);
    if (!tables.ok) throw new Error(`Missing required tables: ${tables.missing.join(', ')}`);
    const ids = await pg.checkGeneratedIdDefaults();
    console.log(`Generated-ID defaults: ${ids.checked}/${ids.expected}`);
    if (ids.missing.length) throw new Error(`Missing ID defaults: ${ids.missing.join(', ')}`);
    if (ids.sequenceBehind.length) throw new Error(`Sequences behind imported IDs: ${ids.sequenceBehind.map(x => x.table).join(', ')}`);
    console.log('PASS: Read-only PostgreSQL preflight completed. No schema or data changes were made.');
  } finally {
    await pg.close();
  }
}

main().catch(error => {
  console.error('PostgreSQL check failed:', error.message);
  process.exitCode = 1;
});
