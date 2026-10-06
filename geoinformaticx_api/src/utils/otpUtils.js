const { transporter } = require('./smtpMailer');

// One-time check at startup so a broken SMTP config shows up immediately in the logs
// instead of silently failing every time someone requests an OTP.
transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP connection failed:', err.message);
  } else {
    console.log('✅ SMTP server ready to send mail');
  }
});

exports.generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); //if mam syy i will try for 6 digit code
};

exports.sendOtpEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"Geoinformaticx" <${process.env.EMAIL_USER}>`,
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

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

exports.sendServiceBookingEmail = async ({ to, sellerName, orderId, customer, items, total, paymentMethod }) => {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:6px 12px;border:1px solid #ddd;">${esc(i.name)}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${esc(i.quantity)}</td>
        <td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">₹${Number(i.price) * i.quantity}</td>
      </tr>`
    )
    .join('');

  await transporter.sendMail({
    from: `"Geoinformaticx" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New service booking #${orderId}`,
    html: `
      <p>Hi ${esc(sellerName)},</p>
      <p>You have a new service booking on Geoinformaticx.</p>

      <h3>Customer details</h3>
      <p>
        <b>Name:</b> ${esc(customer.name)}<br/>
        <b>Phone:</b> ${esc(customer.phone)}<br/>
        <b>Email:</b> ${esc(customer.email)}<br/>
        <b>Address:</b> ${esc(customer.address)}<br/>
        <b>Payment:</b> ${esc((paymentMethod || 'cod').toUpperCase())}
      </p>

      <h3>Booked services</h3>
      <table style="border-collapse:collapse;">
        <tr>
          <th style="padding:6px 12px;border:1px solid #ddd;">Service</th>
          <th style="padding:6px 12px;border:1px solid #ddd;">Qty</th>
          <th style="padding:6px 12px;border:1px solid #ddd;">Amount</th>
        </tr>
        ${rows}
      </table>
      <p><b>Total: ₹${total}</b></p>
      <p>Please contact the customer to schedule the service.</p>
    `,
  });
};