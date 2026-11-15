/**
 * Serverless Proxy & Diagnostic for Evolution-Go WhatsApp Gateway
 * Prevents mixed-content issues when accessed from https://www.shreerajputsagaisambandh.com
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://130.210.15.192:8080';
const API_SECRET = 'sagai_evolution_secret_2026';
const INSTANCE_TOKEN = process.env.WHATSAPP_API_KEY || 'sagai_instance_token_2026';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, phone } = req.query;

  try {
    if (action === 'pair') {
      const targetPhone = phone || '918971928018';
      const pairRes = await fetch(`${WHATSAPP_API_URL}/instance/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': INSTANCE_TOKEN
        },
        body: JSON.stringify({ phone: targetPhone })
      });
      const data = await pairRes.json();
      return res.status(pairRes.status).json(data);
    }

    if (action === 'test-send') {
      const targetNumber = (req.body?.number || phone || '917665941949').replace(/[^0-9]/g, '');
      const sendRes = await fetch(`${WHATSAPP_API_URL}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': INSTANCE_TOKEN
        },
        body: JSON.stringify({
          number: targetNumber.length === 10 ? `91${targetNumber}` : targetNumber,
          text: '654321 – Your OTP\n\nSHREE RAJPUT SAGAI SAMBANDH\n\nYour profile verification OTP is valid for 5 minutes.\n\nPlease do not share this OTP with anyone.\n\n– Team Shree Rajput Sagai Sambandh'
        })
      });
      const data = await sendRes.json();
      return res.status(sendRes.status).json(data);
    }

    // Default action: 'status' - fetch instance state & QR
    const statusRes = await fetch(`${WHATSAPP_API_URL}/instance/all`, {
      headers: { 'apikey': API_SECRET }
    });
    const data = await statusRes.json();
    return res.status(statusRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
