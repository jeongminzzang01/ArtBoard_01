const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { ensureDataDir, DATA_DIR } = require('./utils/file-store');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dataRoutes = require('./routes/data');

// 데이터 디렉토리 확인
ensureDataDir();

// ─── 자동 백업 ───
function createBackup() {
  const backupDir = path.join(DATA_DIR, '_backups');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupPath = path.join(backupDir, `backup-${ts}.json`);

  const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const backup = {};
  dataFiles.forEach(f => {
    try { backup[f] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')); } catch {}
  });
  fs.writeFileSync(backupPath, JSON.stringify(backup), 'utf-8');

  // 최근 10개만 유지
  const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-')).sort();
  while (backups.length > 10) {
    fs.unlinkSync(path.join(backupDir, backups.shift()));
  }
  console.log(`[${new Date().toISOString()}] 백업 생성: ${path.basename(backupPath)}`);
}

// 서버 시작 시 백업
createBackup();
// 6시간마다 백업
setInterval(createBackup, 6 * 60 * 60 * 1000);

const app = express();

// 미들웨어
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);

// HTML 캐시 방지 (JS/CSS는 캐시 허용)
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// 정적 파일 서빙 (public/)
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback
app.get('/{*path}', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`, err.stack);
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' });
});

app.listen(config.port, () => {
  console.log(`ArtBoard 서버가 http://localhost:${config.port} 에서 실행 중입니다`);
});
