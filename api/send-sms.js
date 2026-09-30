/**
 * SMS Dispatch Serverless API Endpoint
 * Supports Fast2SMS (Indian Gateway) and generic webhook gateways
 */
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

    const { phone, message, otp } = body || {};

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Target phone number is required' });
    }

    // Clean phone number to 10 digits
    const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'Invalid 10-digit mobile number' });
    }

    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

    // 1. If Fast2SMS Key is configured
    if (FAST2SMS_API_KEY) {
      let payload;
      if (otp) {
        payload = {
          route: 'otp',
          variables_values: String(otp),
          numbers: cleanPhone
        };
      } else {
        payload = {
          route: 'q',
          message: message || 'Khammaghani from Shree Rajput Sagai Sambandh.',
          language: 'english',
          numbers: cleanPhone
        };
      }

      const f2sResp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const f2sData = await f2sResp.json();
      if (f2sResp.ok && f2sData.return) {
        return res.status(200).json({
          success: true,
          provider: 'Fast2SMS',
          message: 'SMS dispatched successfully via Fast2SMS',
          details: f2sData
        });
      } else {
        console.error('Fast2SMS gateway error:', f2sData);
        return res.status(502).json({
          success: false,
          error: f2sData.message?.[0] || 'Fast2SMS delivery failure',
          details: f2sData
        });
      }
    }

    // 2. Generic SMS Webhook fallback (if configured)
    const SMS_WEBHOOK_URL = process.env.SMS_WEBHOOK_URL;
    if (SMS_WEBHOOK_URL) {
      await fetch(SMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message: message || otp })
      });
      return res.status(200).json({
        success: true,
        provider: 'Webhook',
        message: 'SMS dispatched to custom SMS webhook gateway'
      });
    }

    // 3. Simulated Response when no gateway API key is configured yet
    return res.status(200).json({
      success: true,
      simulated: true,
      message: `SMS simulated for +91 ${cleanPhone}. To deliver real SMS to handsets, add FAST2SMS_API_KEY in environment variables.`,
      phone: cleanPhone,
      otp: otp || null
    });

  } catch (err) {
    console.error('Send SMS API error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error sending SMS' });
  }
};
