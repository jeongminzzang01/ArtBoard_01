const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { readJSON, writeJSON } = require('../utils/file-store');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 셋업 필요 여부 확인 (비인증)
router.get('/setup-status', (req, res) => {
  const users = readJSON('users.json') || [];
  res.json({ ok: true, data: { needsSetup: users.length === 0 } });
});

// 최초 관리자 생성 (사용자가 0명일 때만 허용)
router.post('/setup', (req, res) => {
  const users = readJSON('users.json') || [];
  if (users.length > 0) {
    return res.status(403).json({ ok: false, error: '이미 설정이 완료되었습니다', code: 'SETUP_DONE' });
  }
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ ok: false, error: '이름과 비밀번호를 입력해주세요', code: 'VALIDATION_ERROR' });
  }
  if (password.length < 4) {
    return res.status(400).json({ ok: false, error: '비밀번호는 4자 이상이어야 합니다', code: 'VALIDATION_ERROR' });
  }
  const admin = {
    id: 'user_' + Date.now(),
    name,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  writeJSON('users.json', [admin]);

  const token = jwt.sign(
    { id: admin.id, name: admin.name, role: admin.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: 'lax'
  });
  res.json({ ok: true, data: { user: { id: admin.id, name: admin.name, role: admin.role } } });
});

// 로그인 페이지용: 사용자 이름 목록 (비인증)
router.get('/users-list', (req, res) => {
  const users = readJSON('users.json') || [];
  const names = users.map(u => ({ id: u.id, name: u.name }));
  res.json({ ok: true, data: names });
});

// 로그인
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ ok: false, error: '이름과 비밀번호를 입력해주세요', code: 'VALIDATION_ERROR' });
  }

  const users = readJSON('users.json') || [];
  const user = users.find(u => u.name === name);
  if (!user) {
    return res.status(401).json({ ok: false, error: '사용자를 찾을 수 없습니다', code: 'AUTH_REQUIRED' });
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않습니다', code: 'AUTH_REQUIRED' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: 'lax'
  });

  res.json({ ok: true, data: { user: { id: user.id, name: user.name, role: user.role } } });
});

// 로그아웃
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true, data: null });
});

// 현재 세션 확인
router.get('/me', authMiddleware, (req, res) => {
  res.json({ ok: true, data: { id: req.user.id, name: req.user.name, role: req.user.role } });
});

module.exports = router;
