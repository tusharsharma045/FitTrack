const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/progress - List all progress entries or by member
router.get('/', async (req, res) => {
    try {
        const { member_id } = req.query;
        let query = `
            SELECT 
                fp.*,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.email AS member_email
            FROM fitness_progress fp
            JOIN members m ON fp.member_id = m.member_id
            WHERE 1=1
        `;
        const params = [];

        if (member_id) {
            query += ' AND fp.member_id = ?';
            params.push(member_id);
        }

        query += ' ORDER BY fp.recorded_date DESC, fp.progress_id DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/progress/member/:id/chart - Progress Timeline with Window Function Delta
router.get('/member/:id/chart', async (req, res) => {
    try {
        const { id } = req.params;

        // Uses CTE and LAG Window function to compute progress deltas
        const query = `
            WITH ProgressCTE AS (
                SELECT 
                    progress_id,
                    member_id,
                    recorded_date,
                    weight_kg,
                    height_cm,
                    bmi,
                    body_fat_percentage,
                    chest_cm,
                    waist_cm,
                    arms_cm,
                    remarks,
                    LAG(weight_kg, 1) OVER (ORDER BY recorded_date ASC) AS prev_weight,
                    LAG(bmi, 1) OVER (ORDER BY recorded_date ASC) AS prev_bmi
                FROM fitness_progress
                WHERE member_id = ?
            )
            SELECT 
                *,
                ROUND(weight_kg - prev_weight, 2) AS weight_change,
                ROUND(bmi - prev_bmi, 2) AS bmi_change
            FROM ProgressCTE
            ORDER BY recorded_date ASC;
        `;

        const [rows] = await db.query(query, [id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch member progress chart error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/progress - Log fitness entry (Trigger auto-computes BMI)
router.post('/', async (req, res) => {
    try {
        const { member_id, recorded_date, weight_kg, height_cm, body_fat_percentage, chest_cm, waist_cm, arms_cm, remarks } = req.body;
        if (!member_id || !weight_kg || !height_cm) {
            return res.status(400).json({ success: false, error: 'Member, Weight, and Height are required.' });
        }

        const date = recorded_date || new Date().toISOString().slice(0, 10);

        // Note: bmi column will be auto-calculated by trigger trg_before_insert_fitness_progress
        const [result] = await db.query(`
            INSERT INTO fitness_progress (member_id, recorded_date, weight_kg, height_cm, body_fat_percentage, chest_cm, waist_cm, arms_cm, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [member_id, date, weight_kg, height_cm, body_fat_percentage || null, chest_cm || null, waist_cm || null, arms_cm || null, remarks || '']);

        // Fetch inserted row to view trigger-calculated BMI
        const [insertedRow] = await db.query('SELECT * FROM fitness_progress WHERE progress_id = ?', [result.insertId]);

        res.json({
            success: true,
            message: 'Fitness metrics logged. BMI computed automatically via trigger.',
            data: insertedRow[0]
        });
    } catch (error) {
        console.error('Log progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/progress/:id - Delete entry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM fitness_progress WHERE progress_id = ?', [id]);
        res.json({ success: true, message: 'Progress record deleted.' });
    } catch (error) {
        console.error('Delete progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
