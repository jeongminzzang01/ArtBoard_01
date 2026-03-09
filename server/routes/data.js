const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { readJSON, writeJSON } = require('../utils/file-store');

const router = express.Router();

router.use(authMiddleware);

// 전체 데이터 한번에 로드 (페이지 로드 시)
router.get('/initial', (req, res) => {
  const data = {
    teams: readJSON('teams.json') || [],
    tasks: readJSON('tasks.json') || [],
    milestones: readJSON('milestones.json') || [],
    updateData: readJSON('updates.json') || {},
    pendingByMonth: readJSON('pending.json') || {},
    seatData: readJSON('seats.json') || [],
    devices: readJSON('devices.json') || [],
    toData: readJSON('to.json') || [],
    customHolidays: readJSON('custom-holidays.json') || [],
    displayMonths: readJSON('display-months.json') || [],
    hiddenUpdateDates: readJSON('hidden-update-dates.json') || [],
    archivedMilestones: readJSON('archived-milestones.json') || [],
    archivedTasks: readJSON('archived-tasks.json') || [],
    archivedUpdates: readJSON('archived-updates.json') || {},
  };
  res.json({ ok: true, data });
});

// 벌크 저장 (editor+)
router.put('/save-all', requireRole('admin', 'editor'), (req, res) => {
  const {
    teams, tasks, milestones, updateData, pendingByMonth,
    seatData, devices, toData, customHolidays, displayMonths,
    hiddenUpdateDates, archivedMilestones, archivedTasks, archivedUpdates
  } = req.body;

  if (teams !== undefined) writeJSON('teams.json', teams);
  if (tasks !== undefined) writeJSON('tasks.json', tasks);
  if (milestones !== undefined) writeJSON('milestones.json', milestones);
  if (updateData !== undefined) writeJSON('updates.json', updateData);
  if (pendingByMonth !== undefined) writeJSON('pending.json', pendingByMonth);
  if (seatData !== undefined) writeJSON('seats.json', seatData);
  if (devices !== undefined) writeJSON('devices.json', devices);
  if (toData !== undefined) writeJSON('to.json', toData);
  if (customHolidays !== undefined) writeJSON('custom-holidays.json', customHolidays);
  if (displayMonths !== undefined) writeJSON('display-months.json', displayMonths);
  if (hiddenUpdateDates !== undefined) writeJSON('hidden-update-dates.json', hiddenUpdateDates);
  if (archivedMilestones !== undefined) writeJSON('archived-milestones.json', archivedMilestones);
  if (archivedTasks !== undefined) writeJSON('archived-tasks.json', archivedTasks);
  if (archivedUpdates !== undefined) writeJSON('archived-updates.json', archivedUpdates);

  res.json({ ok: true, data: null });
});

module.exports = router;
