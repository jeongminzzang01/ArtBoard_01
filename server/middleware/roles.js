function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: '로그인이 필요합니다', code: 'AUTH_REQUIRED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: '권한이 없습니다', code: 'FORBIDDEN' });
    }
    next();
  };
}

module.exports = { requireRole };
