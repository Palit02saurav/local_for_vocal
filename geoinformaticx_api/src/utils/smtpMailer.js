const parseFrom = (from) => {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from || '');
  return m ? { name: m[1].trim(), email: m[2].trim() } : { email: String(from || '').trim() };
};

const API_URL = 'https://api.brevo.com/v3';

exports.transporter = {
  // Startup check: confirms the API key is valid
  verify(cb) {
    if (!process.env.BREVO_API_KEY) return cb(new Error('BREVO_API_KEY is not set'));
    fetch(`${API_URL}/account`, { headers: { 'api-key': process.env.BREVO_API_KEY } })
      .then((res) => cb(res.ok ? null : new Error(`Brevo rejected the API key (${res.status})`)))
      .catch(cb);
  },

  async sendMail({ from, to, subject, html, replyTo }) {
    const res = await fetch(`${API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: parseFrom(from),
        to: String(to).split(',').map((e) => ({ email: e.trim() })),
        ...(replyTo && { replyTo: { email: replyTo } }),
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    return res.json();
  },
};