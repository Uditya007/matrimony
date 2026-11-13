/**
 * Vercel Serverless Function: POST /api/verify-whatsapp-otp
 */

const { verifyOtpHandler } = require('./whatsapp-otp');

module.exports = async function handler(req, res) {
  return verifyOtpHandler(req, res);
};
