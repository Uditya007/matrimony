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

    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'Xmqx2kcUKeTvE7AMYaZFVOj8fnyGpDb6RidBu3Hr1oz54NSCQlFQsP9SWCDB8X0afuc56AGUqg3EnyNr';

    // 1. If Fast2SMS Key is configured
    if (FAST2SMS_API_KEY) {
      const otpText = message || (otp 
        ? `Khammaghani! Your verification code for Shree Rajput Sagai Sambandh is ${otp}. Do not share this OTP.` 
        : 'Khammaghani from Shree Rajput Sagai Sambandh.');

      let f2sResp;
      let f2sData = {};

      // 1. Try economical Route 'otp' first (Costs only ₹0.20 - ₹0.25 per SMS)
      if (otp) {
        try {
          f2sResp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': FAST2SMS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              route: 'otp',
              variables_values: String(otp),
              numbers: cleanPhone
            })
          });
          f2sData = await f2sResp.json();
        } catch (otpErr) {
          console.warn('Fast2SMS Route otp attempt notice:', otpErr);
        }
      }

      // 2. If Route 'otp' was not used or failed (e.g. pending KYC/website verification), fall back to Route 'q'
      if (!f2sData || !f2sData.return) {
        try {
          const quickResp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': FAST2SMS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              route: 'q',
              message: otpText,
              language: 'english',
              numbers: cleanPhone
            })
          });
          const quickData = await quickResp.json();
          if (quickData) {
            f2sResp = quickResp;
            f2sData = quickData;
          }
        } catch (qErr) {
          console.warn('Fast2SMS Route q attempt notice:', qErr);
        }
      }

      if (f2sData.return) {
        return res.status(200).json({
          success: true,
          provider: 'Fast2SMS',
          message: 'SMS dispatched successfully via Fast2SMS',
          details: f2sData
        });
      } else {
        const errorMsg = f2sData.message || (Array.isArray(f2sData.message) ? f2sData.message[0] : 'Fast2SMS gateway notice');
        console.warn('Fast2SMS gateway notice:', f2sData);
        return res.status(200).json({
          success: true,
          simulated: true,
          provider: 'Fast2SMS',
          gatewayNotice: errorMsg,
          message: `Fast2SMS notice: ${errorMsg}. Displaying verification code on screen.`,
          otp: otp || null
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
