const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }
    const { amount, currency = 'INR', receipt, notes } = body || {};

    if (!amount || isNaN(amount) || Number(amount) < 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Minimum amount must be at least 100 paise (₹1.00).'
      });
    }

    // Use environment variables or fallback to provided Test Mode credentials
    const DEFAULT_TEST_KEY_ID = 'rzp_test_TgASFu87ziLFNM';
    const DEFAULT_TEST_KEY_SECRET = '0z5pUxdjR0UIGAfpEVeRqAWB';

    const key_id = process.env.RAZORPAY_KEY_ID || DEFAULT_TEST_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET || DEFAULT_TEST_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay credentials not configured in environment.'
      });
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount)),
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: notes || {}
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id
    });
  } catch (err) {
    console.error('Serverless order creation error:', err);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.error?.description || err.message || 'Failed to create Razorpay order'
    });
  }
};
