import { Router } from 'express';
import db from '../database.js';
import { authRequired } from '../middleware/auth.js';
import { calculatePace, calculateCalories } from '../utils/calories.js';

const router = Router();

// GET /api/running?date=...&type=run|ride&all=true
router.get('/', authRequired, (req, res) => {
  const { date, type, all } = req.query;

  // "all" mode: return all records for detail pages
  if (all === 'true') {
    let query = 'SELECT * FROM running_records WHERE user_id = ?';
    const params = [req.userId];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY date DESC, created_at DESC';
    const runs = db.prepare(query).all(...params);
    const parsed = runs.map(r => ({ ...r, splits: JSON.parse(r.splits || '[]') }));
    const totalDistance = parsed.filter(r => !r.hidden).reduce((s, r) => s + r.distance, 0);
    const totalCalories = parsed.reduce((s, r) => s + r.calories, 0);
    return res.json({ runs: parsed, totalDistance: Math.round(totalDistance * 100) / 100, totalCalories });
  }

  // Date-specific mode
  if (!date) {
    return res.status(400).json({ error: '请提供日期参数' });
  }
  let query = 'SELECT * FROM running_records WHERE user_id = ? AND date = ?';
  const params = [req.userId, date];
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  query += ' AND hidden = 0 ORDER BY created_at DESC';
  const runs = db.prepare(query).all(...params);
  const parsed = runs.map(r => ({ ...r, splits: JSON.parse(r.splits || '[]') }));
  res.json({ runs: parsed });
});

// POST /api/running
router.post('/', authRequired, (req, res) => {
  const { date, distance, minutes, splits, type } = req.body;
  const activityType = type || 'run';

  if (!date || !distance || !minutes) {
    return res.status(400).json({ error: '请填写日期、距离和时间' });
  }
  if (distance <= 0 || minutes <= 0) {
    return res.status(400).json({ error: '距离和时间必须大于0' });
  }

  const user = db.prepare('SELECT weight FROM users WHERE id = ?').get(req.userId);
  const pace = calculatePace(distance, minutes, activityType);
  const calories = calculateCalories(user.weight, distance, minutes, activityType);
  const splitsJson = JSON.stringify(splits || []);

  const result = db.prepare(
    'INSERT INTO running_records (user_id, date, distance, minutes, pace, calories, splits, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, date, distance, minutes, pace, calories, splitsJson, activityType);

  res.json({
    id: result.lastInsertRowid,
    user_id: req.userId,
    date, distance, minutes, pace, calories,
    splits: splits || [],
    type: activityType,
    hidden: false,
    created_at: new Date().toISOString()
  });
});

router.put('/:id/hide', authRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.prepare('SELECT * FROM running_records WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  const newHidden = record.hidden ? 0 : 1;
  db.prepare('UPDATE running_records SET hidden = ? WHERE id = ?').run(newHidden, id);
  res.json({ id, hidden: !!newHidden });
});

router.delete('/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.prepare('SELECT * FROM running_records WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  db.prepare('DELETE FROM running_records WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
