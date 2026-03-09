/**
 * 마이그레이션 스크립트: init_data.js + update_data.js → server/data/*.json
 * 사용법: node server/migrate.js
 */
const fs = require('fs');
const path = require('path');
const { writeJSON, ensureDataDir } = require('./utils/file-store');

ensureDataDir();

console.log('데이터 마이그레이션 시작...');

// 1) init_data.js 로드 (export 제거, const→var 변환 후 eval)
const initSource = fs.readFileSync(path.join(__dirname, '..', 'init_data.js'), 'utf-8')
  .replace(/^export\s+/gm, '')
  .replace(/^const\s+/gm, 'var ');
eval(initSource);

// 2) update_data.js 로드
const updateSource = fs.readFileSync(path.join(__dirname, '..', 'update_data.js'), 'utf-8')
  .replace(/^const\s+/gm, 'var ');
eval(updateSource);

// 3) UPDATE_SCHEDULE → updateData, pending 변환 (art_schedule의 INIT_UPDATE 로직 복제)
const updateData = {};
const pending = {};
const addPending = (mk, item) => { if (!pending[mk]) pending[mk] = []; pending[mk].push(item); };

UPDATE_SCHEDULE.forEach(entry => {
  if (entry.date === '보류') {
    addPending('보류', entry.item);
    return;
  }
  const d = entry.date;
  if (!updateData[d]) updateData[d] = { items: [], itemTeams: [], itemJiras: [], milestone: '', firstMerge: '', lastMerge: '' };
  updateData[d].items.push(entry.item);
  updateData[d].itemTeams.push(entry.teams || []);
  updateData[d].itemJiras.push(entry.jira || '');
  if (entry.milestone && !updateData[d].milestone) updateData[d].milestone = entry.milestone;
  if (entry.remark) {
    const year = parseInt(d.split('-')[0]);
    const prd = (rx) => { const m = entry.remark.match(rx); if (!m) return ''; return `${year}-${String(parseInt(m[1])).padStart(2,'0')}-${String(parseInt(m[2])).padStart(2,'0')}`; };
    const fm = prd(/1차 통머지\s*-\s*(\d+)\/(\d+)/);
    const lm = prd(/마지막 통머지\s*-\s*(\d+)\/(\d+)/);
    if (fm && !updateData[d].firstMerge) updateData[d].firstMerge = fm;
    if (lm && !updateData[d].lastMerge) updateData[d].lastMerge = lm;
  }
  if (entry.note) {
    const dt = new Date(d + 'T00:00:00');
    addPending(`${dt.getFullYear()}-${dt.getMonth() + 1}`, entry.note);
  }
});

// 4) displayMonths 생성
const displayMonths = [];
for (let i = 0; i < 12; i++) displayMonths.push({ year: 2025, month: i });
for (let i = 0; i < 12; i++) displayMonths.push({ year: 2026, month: i });

// 5) milestones에 status 추가
const milestones = INIT_MS.map(m => ({ ...m, status: m.status || 'upcoming' }));

// 6) 모든 JSON 파일 쓰기
writeJSON('teams.json', INIT_TEAMS);
writeJSON('tasks.json', INIT_TASKS);
writeJSON('milestones.json', milestones);
writeJSON('updates.json', updateData);
writeJSON('pending.json', pending);
writeJSON('display-months.json', displayMonths);
writeJSON('custom-holidays.json', []);
writeJSON('hidden-update-dates.json', []);
writeJSON('archived-milestones.json', []);
writeJSON('archived-tasks.json', []);
writeJSON('archived-updates.json', {});

// seats, devices, to → art_schedule에 정의되어 있으므로 수동으로 작성
// 빈 배열/객체로 초기화 (기존 art_schedule 코드의 초기값을 별도로 추출해야 함)
if (!fs.existsSync(path.join(__dirname, 'data', 'seats.json'))) {
  writeJSON('seats.json', []);
}
if (!fs.existsSync(path.join(__dirname, 'data', 'devices.json'))) {
  writeJSON('devices.json', []);
}
if (!fs.existsSync(path.join(__dirname, 'data', 'to.json'))) {
  writeJSON('to.json', []);
}

// 7) users.json 초기화 (최초 설정 페이지에서 관리자 생성)
writeJSON('users.json', []);

console.log('마이그레이션 완료!');
console.log('생성된 파일:');
const dataDir = path.join(__dirname, 'data');
fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).forEach(f => {
  const size = fs.statSync(path.join(dataDir, f)).size;
  console.log(`  ${f} (${(size / 1024).toFixed(1)} KB)`);
});
console.log('\n서버 최초 접속 시 브라우저에서 관리자 계정을 생성하세요.');
