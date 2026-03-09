const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ ok: false, error: '로그인이 필요합니다', code: 'AUTH_REQUIRED' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ ok: false, error: '세션이 만료되었습니다', code: 'AUTH_REQUIRED' });
  }
}

module.exports = authMiddleware;
