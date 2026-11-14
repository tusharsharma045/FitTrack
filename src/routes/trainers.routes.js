const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/trainers - List all trainers with analytics
router.get('/', async (req, res) => {
    try {
        const [trainers] = await db.query('SELECT * FROM vw_trainer_performance_analytics ORDER BY trainer_id ASC');
        res.json({ success: true, data: trainers });
    } catch (error) {
        console.error('Fetch trainers error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/trainers - Add New Trainer
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, phone, specialization, experience_years, hourly_rate, status } = req.body;
        if (!first_name || !last_name || !email || !phone || !specialization) {
            return res.status(400).json({ success: false, error: 'Please supply all required trainer fields.' });
        }

        const [result] = await db.query(`
            INSERT INTO trainers (first_name, last_name, email, phone, specialization, experience_years, hourly_rate, hire_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?)
        `, [first_name, last_name, email, phone, specialization, experience_years || 1, hourly_rate || 500, status || 'Active']);

        res.json({ success: true, message: 'Trainer added successfully.', trainer_id: result.insertId });
    } catch (error) {
        console.error('Add trainer error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'A trainer with this email or phone already exists.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/trainers/:id - Update Trainer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, specialization, experience_years, hourly_rate, status } = req.body;

        await db.query(`
            UPDATE trainers
            SET first_name = ?, last_name = ?, email = ?, phone = ?, specialization = ?, experience_years = ?, hourly_rate = ?, status = ?
            WHERE trainer_id = ?
        `, [first_name, last_name, email, phone, specialization, experience_years, hourly_rate, status || 'Active', id]);

        res.json({ success: true, message: 'Trainer updated successfully.' });
    } catch (error) {
        console.error('Update trainer error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/trainers/:id - Delete Trainer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM trainers WHERE trainer_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Trainer not found.' });
        }
        res.json({ success: true, message: 'Trainer removed successfully.' });
    } catch (error) {
        console.error('Delete trainer error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, error: 'Cannot delete trainer with active assignments or workout plans.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/trainers/assignments - List all trainer assignments
router.get('/assignments/all', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                ta.assignment_id,
                ta.assigned_date,
                ta.session_time,
                ta.status,
                m.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.phone AS member_phone,
                t.trainer_id,
                CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
                t.specialization
            FROM trainer_assignments ta
            JOIN members m ON ta.member_id = m.member_id
            JOIN trainers t ON ta.trainer_id = t.trainer_id
            ORDER BY ta.assignment_id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch assignments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/trainers/assign - Assign Trainer to Member
router.post('/assign', async (req, res) => {
    try {
        const { member_id, trainer_id, session_time } = req.body;
        if (!member_id || !trainer_id) {
            return res.status(400).json({ success: false, error: 'Please choose both Member and Trainer.' });
        }

        const [result] = await db.query(`
            INSERT INTO trainer_assignments (member_id, trainer_id, assigned_date, session_time, status)
            VALUES (?, ?, CURRENT_DATE, ?, 'Active')
        `, [member_id, trainer_id, session_time || 'Morning (07:00 - 08:00)']);

        res.json({ success: true, message: 'Trainer assigned successfully.', assignment_id: result.insertId });
    } catch (error) {
        console.error('Assign trainer error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/trainers/assignments/:id/status - Update assignment status
router.put('/assignments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE trainer_assignments SET status = ? WHERE assignment_id = ?', [status, id]);
        res.json({ success: true, message: 'Assignment status updated.' });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
