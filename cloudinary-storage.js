'use strict';

const crypto = require('crypto');

function configuration() {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  return { cloudName, apiKey, apiSecret };
}

function isConfigured() {
  const { cloudName, apiKey, apiSecret } = configuration();
  return Boolean(cloudName && apiKey && apiSecret);
}

function signParameters(params, apiSecret) {
  const payload = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(payload + apiSecret, 'utf8').digest('hex');
}

function assertConfigured() {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }
  return configuration();
}

async function readCloudinaryError(response) {
  let message = `Cloudinary request failed (${response.status}).`;
  try {
    const body = await response.json();
    if (body?.error?.message) message = body.error.message;
  } catch {}
  return message;
}

async function uploadZip(buffer, publicId) {
  const { cloudName, apiKey, apiSecret } = assertConfigured();
  const params = {
  overwrite: 'false',
  public_id: publicId,
  type: 'authenticated',
  timestamp: String(Math.floor(Date.now() / 1000))
};
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', apiKey);
  form.append('signature', signParameters(params, apiSecret));
  form.append('file', new Blob([buffer], { type: 'application/zip' }), 'submission.zip');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/upload`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(await readCloudinaryError(response));
  const result = await response.json();
  if (!result.asset_id || !result.public_id) throw new Error('Cloudinary upload response did not include an asset ID.');
  return { assetId: result.asset_id, publicId: result.public_id, version: result.version };
}

async function downloadAsset(assetId) {
  const { cloudName, apiKey, apiSecret } = assertConfigured();
  if (!/^[a-f0-9]{32}$/i.test(String(assetId || ''))) throw new Error('Stored Cloudinary asset ID is invalid.');
  const params = {
  asset_id: String(assetId),
  timestamp: String(Math.floor(Date.now() / 1000)),
  expires_at: String(Math.floor(Date.now() / 1000) + 300)
};
  const query = new URLSearchParams({ ...params, api_key: apiKey, signature: signParameters(params, apiSecret) });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/asset/download?${query}`, {
    method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(await readCloudinaryError(response));
  return Buffer.from(await response.arrayBuffer());
}

async function destroyAsset(assetId) {
  const { cloudName, apiKey, apiSecret } = assertConfigured();

  const form = new FormData();
  form.append('asset_ids[]', String(assetId));

  const auth = Buffer
    .from(`${apiKey}:${apiSecret}`)
    .toString('base64');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${auth}`
      },
      body: form,
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!response.ok) {
    throw new Error(await readCloudinaryError(response));
  }

  return response.json();
}

module.exports = { isConfigured, uploadZip, downloadAsset, destroyAsset };
