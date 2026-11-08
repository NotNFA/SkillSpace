'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load local .env without printing credential values.
try {
  const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
} catch {}

const cloudinaryStorage = require('../cloudinary-storage');
const testZip = Buffer.from(
  'UEsDBBQAAAAIAMN9Z1201pccOAAAADYAAAAUAAAAY2xvdWRpbmFyeS1jaGVjay50eHQLzs7MyQkuSExOVXDOyS9NycxLLKpUSM7Py0tNLsnMz1MoSS0u0VMITkxLVSjJV0hJzUktSdUDAFBLAQIUAxQAAAAIAMN9Z1201pccOAAAADYAAAAUAAAAAAAAAAAAAACAAQAAAABjbG91ZGluYXJ5LWNoZWNrLnR4dFBLBQYAAAAAAQABAEIAAABqAAAAAAA=',
  'base64'
);

(async () => {
  if (!cloudinaryStorage.isConfigured()) {
    throw new Error('Cloudinary credentials are missing. Check the three CLOUDINARY_* variables in .env.');
  }

  const publicId = `skillspace/connection-tests/check-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.zip`;
  let assetId;
  try {
    const uploaded = await cloudinaryStorage.uploadZip(testZip, publicId);
    assetId = uploaded.assetId;
    console.log('1/3 Cloudinary upload: PASS');

    const downloaded = await cloudinaryStorage.downloadAsset(assetId);
    if (!downloaded.equals(testZip)) throw new Error('Downloaded test file did not match the uploaded file.');
    console.log('2/3 Cloudinary download: PASS');
  } finally {
    if (assetId) {
      await cloudinaryStorage.destroyAsset(assetId);
      console.log('3/3 Cloudinary cleanup: PASS');
    }
  }
  console.log('Cloudinary connection test completed successfully.');
})().catch(error => {
  console.error('Cloudinary connection test failed:', error.message);
  process.exitCode = 1;
});
