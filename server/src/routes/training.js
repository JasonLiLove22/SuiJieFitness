import { Router } from 'express';
import db from '../database.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function mapExercises(rows) {
  return rows.map(e => ({ ...e, completed: !!e.completed }));
}

router.get('/', authRequired, (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: '请提供日期参数' });
  }

  const plan = db.prepare(
    'SELECT id, user_id, date, created_at FROM training_plans WHERE user_id = ? AND date = ?'
  ).get(req.userId, date);

  if (!plan) {
    return res.json({ plan: null, exercises: [] });
  }

  const exercises = mapExercises(db.prepare(
    'SELECT id, name, sets, reps, completed, sort_order FROM training_exercises WHERE plan_id = ? ORDER BY sort_order'
  ).all(plan.id));

  res.json({ plan: { id: plan.id, date: plan.date, created_at: plan.created_at }, exercises });
});

router.put('/:date', authRequired, (req, res) => {
  const { date } = req.params;
  const { exercises } = req.body;

  if (!Array.isArray(exercises)) {
    return res.status(400).json({ error: 'exercises 必须是一个数组' });
  }

  const upsertPlan = db.transaction(() => {
    let plan = db.prepare(
      'SELECT id FROM training_plans WHERE user_id = ? AND date = ?'
    ).get(req.userId, date);

    if (!plan) {
      const result = db.prepare(
        'INSERT INTO training_plans (user_id, date) VALUES (?, ?)'
      ).run(req.userId, date);
      plan = { id: result.lastInsertRowid };
    }

    db.prepare('DELETE FROM training_exercises WHERE plan_id = ?').run(plan.id);

    const insert = db.prepare(
      'INSERT INTO training_exercises (plan_id, name, sets, reps, completed, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      insert.run(plan.id, ex.name, ex.sets || 3, ex.reps || 12, ex.completed ? 1 : 0, i);
    }

    const savedExercises = mapExercises(db.prepare(
      'SELECT id, name, sets, reps, completed, sort_order FROM training_exercises WHERE plan_id = ? ORDER BY sort_order'
    ).all(plan.id));

    return { plan: { id: plan.id, date, created_at: new Date().toISOString() }, exercises: savedExercises };
  });

  try {
    const result = upsertPlan();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '保存失败' });
  }
});

router.put('/:date/exercises/:id/toggle', authRequired, (req, res) => {
  const { date } = req.params;
  const exerciseId = parseInt(req.params.id);

  const exercise = db.prepare(`
    SELECT training_exercises.id, training_exercises.completed
    FROM training_exercises
    JOIN training_plans ON training_plans.id = training_exercises.plan_id
    WHERE training_exercises.id = ? AND training_plans.user_id = ? AND training_plans.date = ?
  `).get(exerciseId, req.userId, date);

  if (!exercise) {
    return res.status(404).json({ error: '训练项不存在' });
  }

  db.prepare('UPDATE training_exercises SET completed = ? WHERE id = ?')
    .run(exercise.completed ? 0 : 1, exerciseId);

  res.json({ id: exerciseId, completed: !exercise.completed });
});

export default router;
