const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Validate Razorpay credentials with Test Mode fallback
const DEFAULT_TEST_KEY_ID = 'rzp_test_TgASFu87ziLFNM';
const DEFAULT_TEST_KEY_SECRET = '0z5pUxdjR0UIGAfpEVeRqAWB';

const KEY_ID = process.env.RAZORPAY_KEY_ID || DEFAULT_TEST_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || DEFAULT_TEST_KEY_SECRET;

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET
});

/**
 * GET /api/config
 * Public configuration endpoint for frontend (exposes KEY_ID only, NEVER KEY_SECRET)
 */
app.get('/api/config', (req, res) => {
  if (!KEY_ID) {
    return res.status(500).json({ error: 'Razorpay Key ID is not configured on server' });
  }
  res.json({
    key_id: KEY_ID
  });
});

/**
 * STEP 1: BACKEND - Create Order
 * POST /api/create-order
 * Request body: { amount (in paise), currency (optional, defaults to INR), receipt (optional) }
 * Minimum amount: 100 paise (₹1)
 */
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validation: amount must be present and at least 100 paise
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Minimum amount must be at least 100 paise (₹1.00).'
      });
    }

    if (!KEY_ID || !KEY_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay API credentials are not configured.'
      });
    }

    const options = {
      amount: Math.round(Number(amount)), // Amount in paise
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: KEY_ID // Send public key to client to avoid hardcoding in frontend
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);

    // Handle authentication failures
    if (err.statusCode === 401 || (err.error && err.error.code === 'BAD_REQUEST_ERROR' && err.error.description.includes('auth'))) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed with payment gateway. Please check API credentials.'
      });
    }

    // Handle Razorpay API errors
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.error?.description || err.message || 'Failed to create Razorpay order.'
    });
  }
});

/**
 * STEP 3: BACKEND - Verify Payment Signature
 * POST /api/verify-payment
 * Request body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validation: required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields (razorpay_order_id, razorpay_payment_id, or razorpay_signature).'
      });
    }

    if (!KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server error: Razorpay secret key is not configured.'
      });
    }

    // Generate expected HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    // Secure comparison
    const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const providedBuffer = Buffer.from(razorpay_signature, 'utf-8');

    if (generatedBuffer.length !== providedBuffer.length) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch.'
      });
    }

    const isSignatureValid = crypto.timingSafeEqual(generatedBuffer, providedBuffer);

    if (isSignatureValid) {
      // Payment signature verified successfully
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully.',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      // Signature mismatch: do NOT mark as paid
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch.'
      });
    }
  } catch (err) {
    console.error('Error verifying payment signature:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying payment signature.'
    });
  }
});

// Fallback route for SPA / root
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏰 Shree Rajput Sagai Sambandh Server running on http://localhost:${PORT}`);
    console.log(`💳 Razorpay API endpoints:`);
    console.log(`   - POST /api/create-order`);
    console.log(`   - POST /api/verify-payment`);
    console.log(`   - GET  /api/config`);
  });
}

module.exports = app;
