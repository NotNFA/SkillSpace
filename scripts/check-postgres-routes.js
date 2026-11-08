'use strict';
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const pkg = require('../package.json');
const required = [
  "app.get('/api/auth/registration-config', (req,res)=>", "app.post('/api/auth/register',async", "app.post('/api/auth/login',async", "app.get('/api/me',auth,async", "app.delete('/api/account',auth,async", "app.get('/api/admin/overview',auth,adminOnly,async", "app.patch('/api/admin/creators/:id/verification',auth,adminOnly,async",
  "app.get(\'/api/admin/users\',auth,adminOnly,async", "app.delete(\'/api/admin/users/:id\',auth,adminOnly,async",
  "app.patch(\'/api/admin/users/:id/ban\',auth,adminOnly,async", "app.post(\'/api/reports\',auth,async", "app.get(\'/api/admin/user-reports\',auth,adminOnly,async", "app.patch(\'/api/admin/user-reports/:id\',auth,adminOnly,async",
  "app.get(\'/api/admin/projects\',auth,adminOnly,async", "app.get(\'/api/admin/submissions\',auth,adminOnly,async",
  "app.get(\'/api/admin/payments\',auth,adminOnly,async", "app.get(\'/api/admin/meetings\',auth,adminOnly,async",
  "app.get(\'/api/admin/support\',auth,adminOnly,async", "app.get(\'/api/admin/system\',auth,adminOnly,async",
  "app.get('/api/creators',async", "app.get('/api/creators/:id',async", "app.put('/api/creator-profile',auth,async",
  "app.get('/api/creator-profile',auth,async", "app.put('/api/client-profile',auth,async", "app.get('/api/client-profile',auth,async",
  "app.get('/api/community/posts',async", "app.post('/api/community/posts',auth,async", "app.get('/api/community/posts/:id',auth,async",
  "app.post('/api/community/posts/:id/messages',auth,async", "app.get('/api/community/my-posts',auth,async",
  "app.post('/api/hiring-requests',auth,async", "app.get('/api/chat/global',auth,async", "app.post('/api/chat/global',auth,async",
  "app.get('/api/chat/users',auth,async", "app.get('/api/chat/dm-invites',auth,async", "app.post('/api/chat/dm-invites',auth,async",
  "app.post('/api/chat/dm-invites/:id/:action',auth,async", "app.post('/api/chat/connect/:userId',auth,async",
  "app.get('/api/chat/dms',auth,async", "app.get('/api/chat/dms/:id/messages',auth,async", "app.post('/api/chat/dms/:id/messages',auth,async",
  "app.get('/api/testimonials',async", "app.post('/api/testimonials',auth,async", "app.get('/api/notifications',auth,async",
  "app.post('/api/notifications/read',auth,async", "app.get('/api/meeting-contacts',auth,async", "app.post('/api/meetings',auth,async",
  "app.get('/api/meetings',auth,async", "app.patch('/api/meetings/:id/accept',auth,async", "app.patch('/api/meetings/:id/reject',auth,async",
  "app.patch('/api/meetings/:id/reschedule',auth,async", "app.patch('/api/meetings/:id/approve-reschedule',auth,async",
  "app.patch('/api/meetings/:id/cancel',auth,async", "app.post('/api/assurance/projects',auth,async", "app.get('/api/assurance/projects',auth,async",
  "app.get('/api/assurance/projects/:id',auth,async", "app.patch('/api/assurance/projects/:id',auth,async",
  "app.post('/api/assurance/projects/:id/agree',auth,async", "app.post('/api/assurance/projects/:id/submissions',auth,assuranceUpload.single('projectZip'),async",
  "app.get('/api/assurance/submissions/:submissionId',auth,async", "app.get('/api/assurance/submissions/:submissionId/download',auth,async",
  "app.post('/api/assurance/submissions/:submissionId/retry-validation',auth,async", "app.patch('/api/assurance/projects/:id/milestones/:milestoneId/approve',auth,async",
  "app.post('/api/assurance/submissions/:submissionId/request-revision',auth,async", "app.post('/api/assurance/projects/:id/scope-check',auth,async",
  "app.get('/api/assurance/reputation/:creatorId',auth,async", "app.get('/api/payments/method',auth,async", "app.put('/api/payments/method',auth,async",
  "app.get('/api/payments',auth,async", "app.post('/api/payments/:id/proof',auth,async", "app.post('/api/payments/:id/confirm',auth,async",
  "app.post('/api/payments/:id/dispute',auth,async", "app.get('/api/payments/:id/document',auth,async",
  "app.post('/api/assurance/projects/:id/feedback',auth,async", "app.get('/api/hirers/:id',auth,async"
];
const routeCount = (source.match(/app\.(?:get|post|put|patch|delete)\(/g) || []).length;
if (routeCount !== required.length) { console.error(`Expected ${required.length} API routes, found ${routeCount}.`); process.exit(1); }
const missing = required.filter(route => !source.includes(route));
if (missing.length) { console.error('Missing async PostgreSQL route declarations:', missing); process.exit(1); }
if (/\bdb\.(?:prepare|exec|transaction|pragma)\s*\(/.test(source) || /require\(['"]better-sqlite3['"]\)/.test(source) || /new Database\(/.test(source)) {
  console.error('SQLite runtime operations remain in server.js.'); process.exit(1);
}
if (pkg.dependencies?.['better-sqlite3']) { console.error('better-sqlite3 remains in package.json.'); process.exit(1); }
if (!source.includes('pg.checkRequiredTables()') || !source.includes('pg.checkGeneratedIdDefaults()')) { console.error('Read-only PostgreSQL startup preflight is missing.'); process.exit(1); }
if (!source.includes('RETURNING id') || !source.includes('pg.transaction(')) { console.error('PostgreSQL insert/transaction handling is missing.'); process.exit(1); }
console.log(`PASS: ${required.length} async PostgreSQL route declarations verified.`);
console.log('PASS: No SQLite runtime operations or better-sqlite3 dependency remain.');
console.log('PASS: Read-only PostgreSQL table and generated-ID preflight is enabled.');
