import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { generateToken, authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, password, name, height, weight } = req.body;

  if (!username || !password || !name || !height || !weight) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  if (height < 100 || height > 250) {
    return res.status(400).json({ error: '身高范围: 100-250 cm' });
  }
  if (weight < 30 || weight > 300) {
    return res.status(400).json({ error: '体重范围: 30-300 kg' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, name, height, weight) VALUES (?, ?, ?, ?, ?)'
  ).run(username, password_hash, name, height, weight);

  const token = generateToken(result.lastInsertRowid);
  res.json({ token, user: { id: result.lastInsertRowid, username, name, height, weight } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user.id);
  const { password_hash, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, username, name, height, weight, created_at, updated_at FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ user });
});

router.put('/me', authRequired, (req, res) => {
  const { name, height, weight } = req.body;

  if (height && (height < 100 || height > 250)) {
    return res.status(400).json({ error: '身高范围: 100-250 cm' });
  }
  if (weight && (weight < 30 || weight > 300)) {
    return res.status(400).json({ error: '体重范围: 30-300 kg' });
  }

  const updates = [];
  const values = [];
  if (name) { updates.push('name = ?'); values.push(name); }
  if (height) { updates.push('height = ?'); values.push(height); }
  if (weight) { updates.push('weight = ?'); values.push(weight); }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }

  updates.push("updated_at = datetime('now', 'localtime')");
  values.push(req.userId);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const user = db.prepare('SELECT id, username, name, height, weight, created_at, updated_at FROM users WHERE id = ?').get(req.userId);
  res.json({ user });
});

export default router;
