/**
 * Legacy API Endpoint: /api/send-sms
 * Forwards all calls strictly to WhatsApp OTP Gateway.
 */

const { sendOtpHandler } = require('./whatsapp-otp');

module.exports = async function handler(req, res) {
  return sendOtpHandler(req, res);
};
