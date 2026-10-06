const { transporter } = require('./smtpMailer');

// Verify the SMTP connection on startup so problems show up in the server logs immediately
transporter.verify((error) => {
  if (error) {
    console.error('Error with mail transporter:', error);
  } else {
    console.log('Mail transporter is ready to send messages');
  }
});

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim();

exports.sendContactEmails = async ({ name, email, phone, subject, message }) => {
  const cleanSubject = oneLine(subject);
  const msgHtml = esc(message).replace(/\n/g, '<br/>');

  // 1) Mail to the company inbox (reply goes straight to the visitor)
  const companyMail = transporter.sendMail({
    from: `"Geoinformaticx Website" <${process.env.EMAIL_USER}>`,
    to: process.env.COMPANY_EMAIL,
    replyTo: email,
    subject: `New contact message: ${cleanSubject}`,
    html: `
      <h3>New message from the contact form</h3>
      <p>
        <b>Name:</b> ${esc(name)}<br/>
        <b>Email:</b> ${esc(email)}<br/>
        <b>Phone:</b> ${esc(phone || 'Not provided')}<br/>
        <b>Subject:</b> ${esc(cleanSubject)}
      </p>
      <p><b>Message:</b></p>
      <p>${msgHtml}</p>
    `,
  });

  // 2) Confirmation mail to the person who filled the form
  const userMail = transporter.sendMail({
    from: `"Geoinformaticx" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'We received your message',
    html: `
      <p>Hi ${esc(name)},</p>
      <p>Thank you for contacting Geoinformaticx. We have received your message and our team will get back to you within 24 hours on business days.</p>
      <p><b>Your message:</b></p>
      <p><b>Subject:</b> ${esc(cleanSubject)}<br/>${msgHtml}</p>
      <p>Regards,<br/>Team Geoinformaticx</p>
    `,
  });

  await Promise.all([companyMail, userMail]);
};


exports.sendNewsletterEmails = async ({ email }) => {
  // 1) Mail to the company inbox
  await transporter.sendMail({
    from: `"Geoinformaticx Website" <${process.env.EMAIL_USER}>`,
    to: process.env.COMPANY_EMAIL,
    replyTo: email,
    subject: `New newsletter subscriber: ${oneLine(email)}`,
    html: `
      <h3>New newsletter subscriber</h3>
      <p><b>Email:</b> ${esc(email)}</p>
    `,
  });

  await transporter.sendMail({
    from: `"Geoinformaticx" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Thanks for subscribing to Geoinformaticx',
    html: `
      <p>Hi,</p>
      <p>Thank you for subscribing to the Geoinformaticx newsletter. You'll be the first to hear about new products, offers and local businesses.</p>
      <p>Regards,<br/>Team Geoinformaticx</p>
    `,
  });
};


exports.sendSellerApplicationEmails = async ({ fullName, email, phone, businessName, category, city }) => {
  // 1) Mail to the company inbox
  const companyMail = transporter.sendMail({
    from: `"Geoinformaticx Website" <${process.env.EMAIL_USER}>`,
    to: process.env.COMPANY_EMAIL,
    replyTo: email,
    subject: `New seller application: ${oneLine(businessName)}`,
    html: `
      <h3>New seller application</h3>
      <p>
        <b>Full name:</b> ${esc(fullName)}<br/>
        <b>Email:</b> ${esc(email)}<br/>
        <b>Phone:</b> ${esc(phone)}<br/>
        <b>Business name:</b> ${esc(businessName)}<br/>
        <b>Category:</b> ${esc(category)}<br/>
        <b>City / Location:</b> ${esc(city)}
      </p>
    `,
  });

  // 2) Confirmation mail to the applicant
  const applicantMail = transporter.sendMail({
    from: `"Geoinformaticx" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'We received your seller application',
    html: `
      <p>Hi ${esc(fullName)},</p>
      <p>Thank you for applying to sell on Geoinformaticx. We have received your application for <b>${esc(businessName)}</b> and our team will contact you shortly to complete your seller setup.</p>
      <p>
        <b>Category:</b> ${esc(category)}<br/>
        <b>City / Location:</b> ${esc(city)}
      </p>
      <p>Regards,<br/>Team Geoinformaticx</p>
    `,
  });

  await Promise.all([companyMail, applicantMail]);
};