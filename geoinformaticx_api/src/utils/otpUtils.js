const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); //if mam syy i will try for 6 digit code
};

exports.sendOtpEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"Geoinformaticx" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Verification Code',
    html: `
      <p>Hi ${name},</p>
      <p>Your verification code is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });
};

exports.sendOtpSms = async (phone, otp) => {
  console.log(`[SMS OTP — not yet configured] Would send ${otp} to ${phone}`);
};