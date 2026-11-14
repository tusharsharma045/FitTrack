const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- EXERCISES REPOSITORY ---

// GET /api/workouts/exercises - List exercises
router.get('/exercises', async (req, res) => {
    try {
        const { muscle_group, difficulty } = req.query;
        let query = 'SELECT * FROM exercises WHERE 1=1';
        const params = [];

        if (muscle_group && muscle_group !== 'All') {
            query += ' AND muscle_group = ?';
            params.push(muscle_group);
        }

        if (difficulty && difficulty !== 'All') {
            query += ' AND difficulty_level = ?';
            params.push(difficulty);
        }

        query += ' ORDER BY exercise_name ASC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch exercises error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/workouts/exercises - Add new exercise
router.post('/exercises', async (req, res) => {
    try {
        const { exercise_name, muscle_group, equipment_needed, difficulty_level, description } = req.body;
        if (!exercise_name || !muscle_group) {
            return res.status(400).json({ success: false, error: 'Exercise name and muscle group are required.' });
        }

        const [result] = await db.query(`
            INSERT INTO exercises (exercise_name, muscle_group, equipment_needed, difficulty_level, description)
            VALUES (?, ?, ?, ?, ?)
        `, [exercise_name, muscle_group, equipment_needed || 'Bodyweight', difficulty_level || 'Beginner', description || '']);

        res.json({ success: true, message: 'Exercise added.', exercise_id: result.insertId });
    } catch (error) {
        console.error('Add exercise error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'An exercise with this name already exists.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/workouts/exercises/:id - Delete exercise
router.delete('/exercises/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM exercises WHERE exercise_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Exercise not found.' });
        }
        res.json({ success: true, message: 'Exercise deleted successfully.' });
    } catch (error) {
        console.error('Delete exercise error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- WORKOUT PLANS & MAPPINGS ---

// GET /api/workouts/plans - List workout plans with trainer info
router.get('/plans', async (req, res) => {
    try {
        const [plans] = await db.query(`
            SELECT 
                wp.workout_plan_id,
                wp.plan_name,
                wp.goal,
                wp.difficulty_level,
                wp.duration_weeks,
                wp.description,
                wp.trainer_id,
                CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
                t.specialization AS trainer_specialization,
                COUNT(we.workout_exercise_id) AS exercise_count
            FROM workout_plans wp
            LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
            LEFT JOIN workout_exercises we ON wp.workout_plan_id = we.workout_plan_id
            GROUP BY wp.workout_plan_id, wp.plan_name, wp.goal, wp.difficulty_level, wp.duration_weeks, wp.description, wp.trainer_id, t.first_name, t.last_name, t.specialization
            ORDER BY wp.workout_plan_id DESC
        `);
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error('Fetch workout plans error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/workouts/plans/:id - Plan details with mapped exercises
router.get('/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [planRows] = await db.query(`
            SELECT 
                wp.*,
                CONCAT(t.first_name, ' ', t.last_name) AS trainer_name
            FROM workout_plans wp
            LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
            WHERE wp.workout_plan_id = ?
        `, [id]);

        if (planRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Workout plan not found.' });
        }

        const [exercises] = await db.query(`
            SELECT 
                we.workout_exercise_id,
                we.day_of_week,
                we.sets,
                we.reps,
                we.rest_seconds,
                e.exercise_id,
                e.exercise_name,
                e.muscle_group,
                e.equipment_needed,
                e.difficulty_level
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.exercise_id
            WHERE we.workout_plan_id = ?
            ORDER BY FIELD(we.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), we.workout_exercise_id ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                plan: planRows[0],
                exercises
            }
        });
    } catch (error) {
        console.error('Fetch plan detail error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/workouts/plans - Create workout plan
router.post('/plans', async (req, res) => {
    try {
        const { trainer_id, plan_name, goal, difficulty_level, duration_weeks, description } = req.body;
        if (!plan_name || !goal) {
            return res.status(400).json({ success: false, error: 'Plan name and fitness goal are required.' });
        }

        const [result] = await db.query(`
            INSERT INTO workout_plans (trainer_id, plan_name, goal, difficulty_level, duration_weeks, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [trainer_id || null, plan_name, goal, difficulty_level || 'Beginner', duration_weeks || 4, description || '']);

        res.json({ success: true, message: 'Workout plan created.', plan_id: result.insertId });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/workouts/plans/:id/exercises - Add exercise to workout plan
router.post('/plans/:id/exercises', async (req, res) => {
    try {
        const { id } = req.params;
        const { exercise_id, day_of_week, sets, reps, rest_seconds } = req.body;

        if (!exercise_id || !day_of_week || !sets || !reps) {
            return res.status(400).json({ success: false, error: 'Exercise, Day of week, sets and reps are required.' });
        }

        const [result] = await db.query(`
            INSERT INTO workout_exercises (workout_plan_id, exercise_id, day_of_week, sets, reps, rest_seconds)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id, exercise_id, day_of_week, sets, reps, rest_seconds || 60]);

        res.json({ success: true, message: 'Exercise added to workout routine.', workout_exercise_id: result.insertId });
    } catch (error) {
        console.error('Map exercise error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'This exercise is already scheduled for that day in this plan.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/workouts/plans/:plan_id/exercises/:we_id - Remove exercise from plan
router.delete('/plans/:plan_id/exercises/:we_id', async (req, res) => {
    try {
        const { plan_id, we_id } = req.params;
        await db.query('DELETE FROM workout_exercises WHERE workout_plan_id = ? AND workout_exercise_id = ?', [plan_id, we_id]);
        res.json({ success: true, message: 'Exercise removed from plan.' });
    } catch (error) {
        console.error('Remove exercise error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
