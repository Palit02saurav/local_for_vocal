const jwt = require('jsonwebtoken');

module.exports = function verifyCustomerToken(req, res, next) {
  const token = req.cookies?.customer_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.customerId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};