import { Router } from 'express';
import db from '../database.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: '请提供年份和月份' });
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  // Get all training plans in the month
  const plans = db.prepare(`
    SELECT tp.id, tp.date, tp.created_at
    FROM training_plans tp
    WHERE tp.user_id = ? AND tp.date >= ? AND tp.date <= ?
    ORDER BY tp.date DESC
  `).all(req.userId, startDate, endDate);

  // Get all exercises for those plans
  const planIds = plans.map(p => p.id);
  let exercisesByPlan = {};
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => '?').join(',');
    const exercises = db.prepare(`
      SELECT id, plan_id, name, sets, reps, completed, sort_order
      FROM training_exercises
      WHERE plan_id IN (${placeholders})
      ORDER BY sort_order
    `).all(...planIds);

    for (const ex of exercises) {
      if (!exercisesByPlan[ex.plan_id]) exercisesByPlan[ex.plan_id] = [];
      exercisesByPlan[ex.plan_id].push({ ...ex, completed: !!ex.completed });
    }
  }

  // Get ALL running records in the month (including hidden for calorie stats)
  const allRuns = db.prepare(`
    SELECT * FROM running_records
    WHERE user_id = ? AND date >= ? AND date <= ?
    ORDER BY date DESC, created_at DESC
  `).all(req.userId, startDate, endDate);

  const runsByDate = {};      // visible only
  const allRunsByDate = {};   // all including hidden
  for (const run of allRuns) {
    const r = { ...run, splits: JSON.parse(run.splits || '[]') };
    if (!allRunsByDate[r.date]) allRunsByDate[r.date] = [];
    allRunsByDate[r.date].push(r);
    if (!r.hidden) {
      if (!runsByDate[r.date]) runsByDate[r.date] = [];
      runsByDate[r.date].push(r);
    }
  }

  // Combine into daily records
  const days = [];
  const allDates = new Set([
    ...plans.map(p => p.date),
    ...Object.keys(allRunsByDate)
  ]);

  for (const date of [...allDates].sort().reverse()) {
    const plan = plans.find(p => p.date === date);
    const dayRuns = runsByDate[date] || [];
    const allDayRuns = allRunsByDate[date] || [];
    const exercises = plan ? (exercisesByPlan[plan.id] || []) : [];

    days.push({
      date,
      hasTraining: !!plan && exercises.length > 0,
      trainingCompleted: exercises.length > 0 && exercises.every(e => e.completed),
      exerciseCount: exercises.length,
      completedCount: exercises.filter(e => e.completed).length,
      exercises: exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, completed: e.completed })),
      runs: dayRuns,
      totalDistance: allDayRuns.reduce((sum, r) => sum + r.distance, 0),
      totalCalories: allDayRuns.reduce((sum, r) => sum + r.calories, 0)
    });
  }

  res.json({ days });
});

export default router;
