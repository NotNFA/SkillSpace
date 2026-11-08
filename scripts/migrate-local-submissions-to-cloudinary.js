'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load local .env before requiring PostgreSQL. Never print credential values.
try {
  const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const pg = require('../db/postgres');
const cloudinary = require('../cloudinary-storage');
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'project-submissions');
const dryRun = process.argv.includes('--dry-run');
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

function resolveLegacyPath(storedPath) {
  const base = UPLOAD_DIR + path.sep;
  const resolved = path.resolve(UPLOAD_DIR, String(storedPath || ''));
  if (!resolved.startsWith(base)) throw new Error('Stored local ZIP path is outside the submissions directory.');
  return resolved;
}

(async () => {
  if (!cloudinary.isConfigured()) throw new Error('Cloudinary credentials are missing. Configure all three CLOUDINARY_* variables first.');

  const rows = await pg.many(
    `SELECT id, zip_name, zip_path FROM project_submissions
      WHERE zip_path IS NOT NULL AND zip_path <> ''
        AND zip_path NOT LIKE 'cloudinary:%'
      ORDER BY id`
  );
  console.log(`Found ${rows.length} legacy local submission(s).${dryRun ? ' Dry run only; no changes will be made.' : ''}`);

  let migrated = 0, skipped = 0, failed = 0;
  for (const row of rows) {
    let uploadedAssetId = null;
    try {
      const localPath = resolveLegacyPath(row.zip_path);
      if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
        console.error(`Submission ${row.id}: local ZIP is missing; database record was left unchanged.`);
        skipped++; continue;
      }
      const buffer = fs.readFileSync(localPath);
      if (buffer.length < 22 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        console.error(`Submission ${row.id}: file does not have a ZIP signature; database record was left unchanged.`);
        skipped++; continue;
      }
      if (dryRun) {
        console.log(`Submission ${row.id}: ready (${buffer.length} bytes).`);
        migrated++; continue;
      }

      const publicId = `skillspace/project-submissions/legacy-${row.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const uploaded = await cloudinary.uploadZip(buffer, publicId);
      uploadedAssetId = uploaded.assetId;
      const remoteBuffer = await cloudinary.downloadAsset(uploadedAssetId);
      if (sha256(remoteBuffer) !== sha256(buffer)) throw new Error('Cloudinary verification checksum mismatch.');

      const updated = await pg.query(
        `UPDATE project_submissions SET zip_path=$1, updated_at=CURRENT_TIMESTAMP
          WHERE id=$2 AND zip_path=$3`,
        [`cloudinary:${uploadedAssetId}`, row.id, row.zip_path]
      );
      if (updated.rowCount !== 1) throw new Error('Database record changed during migration; refusing to overwrite it.');
      uploadedAssetId = null;
      console.log(`Submission ${row.id}: migrated and checksum-verified.`);
      migrated++;
      // Keep the original local file as a rollback copy.
    } catch (error) {
      if (uploadedAssetId) {
        try { await cloudinary.destroyAsset(uploadedAssetId); }
        catch (cleanupError) { console.error(`Submission ${row.id}: cleanup of unreferenced Cloudinary asset failed: ${cleanupError.message}`); }
      }
      console.error(`Submission ${row.id}: migration failed: ${error.message}`);
      failed++;
    }
  }
  console.log(`Migration summary: ${migrated} ${dryRun ? 'ready' : 'migrated'}, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
})().catch(error => {
  console.error(`Local ZIP migration stopped: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  try { await pg.close(); } catch {}
});
