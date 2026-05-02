import { Router } from 'express';
import db from '../database.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  // Training days count
  const trainingDays = db.prepare(`
    SELECT count(DISTINCT date) as days FROM training_plans WHERE user_id = ?
  `).get(req.userId).days;

  // Run count
  const runCount = db.prepare(`
    SELECT count(*) as cnt FROM running_records WHERE user_id = ? AND type = 'run' AND hidden = 0
  `).get(req.userId).cnt;

  // Ride count
  const rideCount = db.prepare(`
    SELECT count(*) as cnt FROM running_records WHERE user_id = ? AND type = 'ride' AND hidden = 0
  `).get(req.userId).cnt;

  // Total calories (all time, including hidden)
  const totalCal = db.prepare(`
    SELECT coalesce(sum(calories), 0) as total FROM running_records WHERE user_id = ?
  `).get(req.userId).total;

  res.json({ trainingDays, runCount, rideCount, totalCal });
});

export default router;
