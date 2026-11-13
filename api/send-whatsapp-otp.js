/**
 * Vercel Serverless Function: POST /api/send-whatsapp-otp
 */

const { sendOtpHandler } = require('./whatsapp-otp');

module.exports = async function handler(req, res) {
  return sendOtpHandler(req, res);
};
