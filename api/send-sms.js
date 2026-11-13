/**
 * Message Dispatch Endpoint
 * Strictly forwards all OTP and notification dispatches exclusively through WhatsApp (Evolution-Go).
 * SMS has been deprecated/disabled per policy.
 */

const { sendWhatsAppOtp } = require('./whatsapp-otp');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { phone, otp, name } = body || {};

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Target phone number is required' });
    }

    // Strictly send via WhatsApp only
    const waResult = await sendWhatsAppOtp(phone, otp, name);
    return res.status(waResult.success ? 200 : 400).json({
      success: waResult.success,
      provider: 'WhatsApp',
      channel: 'WhatsApp',
      message: waResult.message || waResult.error,
      details: waResult
    });

  } catch (err) {
    console.error('WhatsApp Dispatch Error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Error sending WhatsApp verification code' 
    });
  }
};
