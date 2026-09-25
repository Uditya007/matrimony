const crypto = require('crypto');

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields'
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Server error: Razorpay secret key is not configured'
      });
    }

    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const providedBuffer = Buffer.from(razorpay_signature, 'utf-8');

    if (generatedBuffer.length !== providedBuffer.length) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch'
      });
    }

    const isSignatureValid = crypto.timingSafeEqual(generatedBuffer, providedBuffer);

    if (isSignatureValid) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch'
      });
    }
  } catch (err) {
    console.error('Serverless verify payment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying payment signature'
    });
  }
};
