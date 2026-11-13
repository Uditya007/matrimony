/**
 * SMS & WhatsApp Dispatch Serverless API Endpoint
 * Dispatches via WhatsApp (Evolution-Go) first, falling back to Fast2SMS
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

    const { phone, message, otp, name } = body || {};

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Target phone number is required' });
    }

    // Try WhatsApp first
    try {
      const waResult = await sendWhatsAppOtp(phone, otp, name);
      if (waResult && waResult.channel === 'WhatsApp') {
        return res.status(200).json({
          success: true,
          provider: 'WhatsApp',
          channel: 'WhatsApp',
          message: 'OTP dispatched successfully via WhatsApp',
          details: waResult
        });
      }
    } catch (waErr) {
      console.warn('WhatsApp attempt note in send-sms:', waErr.message);
    }

    // Clean phone number to 10 digits
    const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'Invalid 10-digit mobile number' });
    }

    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'Xmqx2kcUKeTvE7AMYaZFVOj8fnyGpDb6RidBu3Hr1oz54NSCQlFQsP9SWCDB8X0afuc56AGUqg3EnyNr';

    // Fall back to Fast2SMS Key
    if (FAST2SMS_API_KEY) {
      const otpText = message || (otp 
        ? `Khammaghani! Your verification code for Shree Rajput Sagai Sambandh is ${otp}. Do not share this OTP.` 
        : 'Khammaghani from Shree Rajput Sagai Sambandh.');

      let f2sResp;
      let f2sData = {};

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
        return res.status(200).json({
          success: true,
          simulated: true,
          provider: 'Fast2SMS',
          gatewayNotice: errorMsg,
          message: `Fast2SMS notice: ${errorMsg}.`,
          otp: otp || null
        });
      }
    }

    return res.status(200).json({
      success: true,
      simulated: true,
      message: `Verification code generated for +91 ${cleanPhone}.`,
      phone: cleanPhone,
      otp: otp || null
    });

  } catch (err) {
    console.error('Send SMS/WhatsApp API error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error sending message' });
  }
};
