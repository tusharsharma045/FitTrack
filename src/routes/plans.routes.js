const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/plans - List membership plans with active subscriptions count
router.get('/', async (req, res) => {
    try {
        const [plans] = await db.query(`
            SELECT 
                mp.*,
                COUNT(ms.membership_id) AS total_subscribers,
                SUM(CASE WHEN ms.status = 'Active' AND ms.end_date >= CURRENT_DATE THEN 1 ELSE 0 END) AS active_subscribers
            FROM membership_plans mp
            LEFT JOIN memberships ms ON mp.plan_id = ms.plan_id
            GROUP BY mp.plan_id, mp.plan_name, mp.description, mp.duration_months, mp.fee, mp.status, mp.created_at
            ORDER BY mp.plan_id ASC
        `);
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error('Fetch plans error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/plans - Create new plan
router.post('/', async (req, res) => {
    try {
        const { plan_name, description, duration_months, fee, status } = req.body;
        if (!plan_name || !duration_months || fee === undefined) {
            return res.status(400).json({ success: false, error: 'Please supply plan name, duration, and fee.' });
        }

        const [result] = await db.query(`
            INSERT INTO membership_plans (plan_name, description, duration_months, fee, status)
            VALUES (?, ?, ?, ?, ?)
        `, [plan_name, description || '', duration_months, fee, status || 'Active']);

        res.json({ success: true, message: 'Membership plan created.', plan_id: result.insertId });
    } catch (error) {
        console.error('Create plan error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'A plan with this name already exists.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/plans/:id - Update plan
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { plan_name, description, duration_months, fee, status } = req.body;

        await db.query(`
            UPDATE membership_plans
            SET plan_name = ?, description = ?, duration_months = ?, fee = ?, status = ?
            WHERE plan_id = ?
        `, [plan_name, description, duration_months, fee, status || 'Active', id]);

        res.json({ success: true, message: 'Plan updated successfully.' });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/plans/:id - Delete plan
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM membership_plans WHERE plan_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Plan not found.' });
        }
        res.json({ success: true, message: 'Plan deleted successfully.' });
    } catch (error) {
        console.error('Delete plan error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, error: 'Cannot delete plan: members are currently subscribed to it.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
