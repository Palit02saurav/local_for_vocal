const CommonService = require('../services/commonService');
const { sendContactEmails, sendSellerApplicationEmails, sendNewsletterEmails } = require('../utils/contactMailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Very simple in-memory rate limit: 5 submissions per IP per 15 minutes
const hits = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = 5;

const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
};

exports.submit = async (req, res) => {
  try {
    if (isRateLimited(req.ip)) {
      return CommonService.sendResponse(res, 429, false, 'Too many messages. Please try again later.');
    }

    const { name, email, phone, subject, message } = req.body || {};

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return CommonService.sendResponse(res, 400, false, 'Name, email, subject and message are required.');
    }
    if (!EMAIL_RE.test(email.trim())) {
      return CommonService.sendResponse(res, 400, false, 'Please enter a valid email address.');
    }
    if (subject.length > 150 || message.length > 5000) {
      return CommonService.sendResponse(res, 400, false, 'Subject or message is too long.');
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      subject: subject.trim(),
      message: message.trim(),
    };

    // Reply to the visitor straight away, send the emails in the background
    CommonService.sendResponse(res, 200, true, 'Your message has been sent successfully.');

    sendContactEmails(payload)
      .then(() => console.log('Contact emails sent for', payload.email))
      .catch((err) =>
        console.error('Background contact email failed:', err.message, '| code:', err.code, '| response:', err.response)
      );
  } catch (err) {
    console.error('Contact form error:', err);
    CommonService.sendResponse(res, 500, false, 'Could not send your message. Please try again later.');
  }
};


exports.sellerApplication = async (req, res) => {
  try {
    if (isRateLimited(`seller:${req.ip}`)) {
      return CommonService.sendResponse(res, 429, false, 'Too many applications. Please try again later.');
    }

    const { fullName, email, phone, businessName, category, city, agreed } = req.body || {};

    if (![fullName, email, phone, businessName, category, city].every((v) => v?.trim())) {
      return CommonService.sendResponse(res, 400, false, 'Please fill in all required fields.');
    }
    if (!EMAIL_RE.test(email.trim())) {
      return CommonService.sendResponse(res, 400, false, 'Please enter a valid email address.');
    }
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      return CommonService.sendResponse(res, 400, false, 'Please enter a valid phone number.');
    }
    if (agreed !== true) {
      return CommonService.sendResponse(res, 400, false, 'You must accept the Terms & Conditions and Seller Policy.');
    }
    if ([fullName, businessName, category, city].some((v) => v.length > 150)) {
      return CommonService.sendResponse(res, 400, false, 'One of the fields is too long.');
    }

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      businessName: businessName.trim(),
      category: category.trim(),
      city: city.trim(),
    };

    CommonService.sendResponse(res, 200, true, 'Your application has been submitted successfully.');

    sendSellerApplicationEmails(payload)
      .then(() => console.log('Seller application emails sent for', payload.email))
      .catch((err) =>
        console.error('Background seller application email failed:', err.message, '| code:', err.code, '| response:', err.response)
      );
  } catch (err) {
    console.error('Seller application error:', err);
    CommonService.sendResponse(res, 500, false, 'Could not submit your application. Please try again later.');
  }
};





exports.subscribe = async (req, res) => {
  try {
    if (isRateLimited(`newsletter:${req.ip}`)) {
      return CommonService.sendResponse(res, 429, false, 'Too many attempts. Please try again later.');
    }

    const { email } = req.body || {};

    if (!email?.trim()) {
      return CommonService.sendResponse(res, 400, false, 'Please enter your email address.');
    }
    if (!EMAIL_RE.test(email.trim()) || email.length > 150) {
      return CommonService.sendResponse(res, 400, false, 'Please enter a valid email address.');
    }

    await sendNewsletterEmails({ email: email.trim() });

    CommonService.sendResponse(res, 200, true, 'Thanks for subscribing!');
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    CommonService.sendResponse(res, 500, false, 'Could not subscribe right now. Please try again later.');
  }
};  