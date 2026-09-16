exports.sendResponse = (res, status, success, message, data = null) => {
  const body = { success: !!success, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};