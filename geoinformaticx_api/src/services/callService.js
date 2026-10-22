const toE164 = (p) => '+91' + String(p).replace(/\D/g, '').slice(-10);

exports.connectCall = async ({ from, to }) => {
  const url = `https://${process.env.EXOTEL_SUBDOMAIN}/v1/Accounts/${process.env.EXOTEL_SID}/Calls/connect.json`;
  const auth = Buffer.from(`${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: toE164(from),          // customer is rung first
      To: toE164(to),              // then the provider
      CallerId: process.env.EXOTEL_EXOPHONE,
    }),
  });

  if (!res.ok) {
    console.error('Exotel error:', res.status, await res.text());
    const err = new Error('Could not start the call. Please try again.');
    err.status = 502;
    throw err;
  }
};