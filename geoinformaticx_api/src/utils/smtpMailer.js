const dns = require('dns').promises;
const nodemailer = require('nodemailer');

const HOST = process.env.EMAIL_HOST || 'asmtp.mail.hostpoint.ch';
const PORT = Number(process.env.EMAIL_PORT) || 465;

let cachedIp = null;
let cachedAt = 0;
let cachedTransport = null;
let cachedTransportIp = null;

const resolveIPv4 = async () => {
  if (cachedIp && Date.now() - cachedAt < 5 * 60 * 1000) return cachedIp;
  try {
    const [ip] = await dns.resolve4(HOST);
    cachedIp = ip;
    cachedAt = Date.now();
    return ip;
  } catch (err) {
    console.error('IPv4 lookup failed, falling back to hostname:', err.message);
    return HOST;
  }
};

const getTransport = async () => {
  const ip = await resolveIPv4();
  if (cachedTransport && cachedTransportIp === ip) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: ip,
    port: PORT,
    secure: PORT === 465,
    tls: { servername: HOST }, // certificate is still checked against the real hostname
    connectionTimeout: 30000, // 30s to connect
    greetingTimeout: 30000,   // 30s to get the server greeting
    socketTimeout: 60000,     // 60s of silence before giving up
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  cachedTransportIp = ip;
  return cachedTransport;
};

exports.transporter = {
  async sendMail(message) {
    return (await getTransport()).sendMail(message);
  },
  verify(cb) {
    getTransport().then((t) => t.verify(cb)).catch(cb);
  },
};