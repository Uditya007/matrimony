const crypto = require('crypto');

// In-memory rate limiting map for brute-force protection
const failedAttempts = new Map();

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'rajput_royal_vault_secret_key_2026_secured';
const ADMIN_PIN = process.env.ADMIN_SECRET_PIN || '7665';

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const clientIp = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();

  // Rate Limiting: Max 5 failed attempts in 10 minutes
  const ipRecord = failedAttempts.get(clientIp);
  if (ipRecord && ipRecord.count >= 5) {
    if (now - ipRecord.lastAttempt < 10 * 60 * 1000) {
      const waitMinutes = Math.ceil((10 * 60 * 1000 - (now - ipRecord.lastAttempt)) / 60000);
      return res.status(429).json({
        success: false,
        error: `Too many failed attempts. Security lock active. Please try again in ${waitMinutes} minute(s).`
      });
    } else {
      // Reset after lock expired
      failedAttempts.delete(clientIp);
    }
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { pin } = body || {};

    if (!pin) {
      return res.status(400).json({ success: false, error: 'PIN is required' });
    }

    // Timing-safe comparison to prevent timing attacks
    const pinBuffer = Buffer.from(String(pin), 'utf-8');
    const secretBuffer = Buffer.from(String(ADMIN_PIN), 'utf-8');

    let isValid = false;
    if (pinBuffer.length === secretBuffer.length) {
      isValid = crypto.timingSafeEqual(pinBuffer, secretBuffer);
    }

    if (!isValid) {
      // Record failed attempt
      const current = failedAttempts.get(clientIp) || { count: 0, lastAttempt: now };
      current.count += 1;
      current.lastAttempt = now;
      failedAttempts.set(clientIp, current);

      return res.status(401).json({
        success: false,
        error: 'Access Denied: Invalid Security PIN'
      });
    }

    // Success: Reset failed attempts for this IP
    failedAttempts.delete(clientIp);

    // Generate signed session token valid for 8 hours
    const payload = {
      role: 'admin',
      iat: now,
      exp: now + 8 * 60 * 60 * 1000
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', ADMIN_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const token = `${payloadB64}.${signature}`;

    return res.status(200).json({
      success: true,
      token,
      expiresAt: payload.exp
    });

  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(500).json({ success: false, error: 'Server authentication error' });
  }
};
