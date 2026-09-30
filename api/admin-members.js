const crypto = require('crypto');

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'rajput_royal_vault_secret_key_2026_secured';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://afbrznllcfgfcjuinnlf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0';

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, receivedSig] = parts;

  // Recreate expected signature
  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const recBuffer = Buffer.from(receivedSig);
  const expBuffer = Buffer.from(expectedSig);

  if (recBuffer.length !== expBuffer.length) return false;
  if (!crypto.timingSafeEqual(recBuffer, expBuffer)) return false;

  // Parse payload and check expiry
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload || payload.role !== 'admin') return false;
    if (Date.now() > payload.exp) return false;
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract Bearer token from Authorization header or body
  const authHeader = req.headers['authorization'] || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token && req.body) {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    token = body?.token;
  }

  // Strictly verify token on server
  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired administrative session token'
    });
  }

  try {
    // Fetch live profiles directly from Supabase REST endpoint on server
    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles?select=*`;
    const response = await fetch(endpoint, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase query error in admin-members:', response.status, errText);
      return res.status(500).json({
        success: false,
        error: 'Failed to query member database'
      });
    }

    const profiles = await response.json();

    return res.status(200).json({
      success: true,
      count: profiles.length,
      profiles
    });

  } catch (err) {
    console.error('Server admin-members error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching member directory'
    });
  }
};
