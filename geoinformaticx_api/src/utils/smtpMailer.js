// Sends mail through Brevo's HTTPS API (port 443) instead of SMTP, because
// Render blocks outbound SMTP. Same interface as before: transporter.sendMail / verify.
const API_URL = 'https://api.brevo.com/v3';

// '"Geoinformaticx" <info@site.com>'  ->  { name: 'Geoinformaticx', email: 'info@site.com' }
const parseAddress = (value) => {
  const str = String(value || '').trim();
  const m = str.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim() || undefined, email: m[2].trim() };
  return { email: str };
};

const toList = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map(parseAddress);

const brevo = async (path, options = {}) => {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not set');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'api-key': key, accept: 'application/json', 'content-type': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${data.message || text}`);
  return data;
};

exports.transporter = {
  async sendMail(message) {
    const body = {
      sender: parseAddress(message.from),
      to: toList(message.to),
      subject: message.subject,
      htmlContent: message.html,
    };
    if (message.replyTo) body.replyTo = parseAddress(message.replyTo);
    return brevo('/smtp/email', { method: 'POST', body: JSON.stringify(body) });
  },
  verify(cb) {
    brevo('/account').then(() => cb(null, true)).catch(cb);
  },
};