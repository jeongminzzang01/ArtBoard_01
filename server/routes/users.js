const express = require('express');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { readJSON, writeJSON } = require('../utils/file-store');

const router = express.Router();

// 모든 사용자 관리 라우트는 관리자 전용
router.use(authMiddleware, requireRole('admin'));

// 사용자 목록
router.get('/', (req, res) => {
  const users = readJSON('users.json') || [];
  const safe = users.map(u => ({ id: u.id, name: u.name, role: u.role, createdAt: u.createdAt }));
  res.json({ ok: true, data: safe });
});

// 사용자 추가
router.post('/', (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ ok: false, error: '이름, 비밀번호, 역할을 입력해주세요', code: 'VALIDATION_ERROR' });
  }
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ ok: false, error: '유효하지 않은 역할입니다', code: 'VALIDATION_ERROR' });
  }

  const users = readJSON('users.json') || [];
  if (users.find(u => u.name === name)) {
    return res.status(409).json({ ok: false, error: '이미 존재하는 이름입니다', code: 'CONFLICT' });
  }

  const newUser = {
    id: 'user_' + Date.now(),
    name,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeJSON('users.json', users);

  res.json({ ok: true, data: { id: newUser.id, name: newUser.name, role: newUser.role, createdAt: newUser.createdAt } });
});

// 사용자 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, password, role } = req.body;

  const users = readJSON('users.json') || [];
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: '사용자를 찾을 수 없습니다', code: 'NOT_FOUND' });
  }

  if (name) {
    const dup = users.find(u => u.name === name && u.id !== id);
    if (dup) return res.status(409).json({ ok: false, error: '이미 존재하는 이름입니다', code: 'CONFLICT' });
    users[idx].name = name;
  }
  if (password) users[idx].passwordHash = bcrypt.hashSync(password, 10);
  if (role && ['admin', 'editor', 'viewer'].includes(role)) users[idx].role = role;

  writeJSON('users.json', users);
  const u = users[idx];
  res.json({ ok: true, data: { id: u.id, name: u.name, role: u.role, createdAt: u.createdAt } });
});

// 사용자 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ ok: false, error: '자기 자신은 삭제할 수 없습니다', code: 'VALIDATION_ERROR' });
  }

  const users = readJSON('users.json') || [];
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: '사용자를 찾을 수 없습니다', code: 'NOT_FOUND' });
  }

  users.splice(idx, 1);
  writeJSON('users.json', users);
  res.json({ ok: true, data: null });
});

module.exports = router;
