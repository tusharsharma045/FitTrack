const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/payments - List payments with filters
router.get('/', async (req, res) => {
    try {
        const { status, method } = req.query;
        let query = `
            SELECT 
                p.payment_id,
                p.membership_id,
                p.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.email AS member_email,
                m.phone AS member_phone,
                mp.plan_name,
                p.amount,
                p.payment_date,
                p.payment_method,
                p.payment_status,
                p.transaction_id,
                p.created_at
            FROM payments p
            JOIN members m ON p.member_id = m.member_id
            JOIN memberships ms ON p.membership_id = ms.membership_id
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'All') {
            query += ' AND p.payment_status = ?';
            params.push(status);
        }

        if (method && method !== 'All') {
            query += ' AND p.payment_method = ?';
            params.push(method);
        }

        query += ' ORDER BY p.payment_date DESC, p.payment_id DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/payments - Record new payment
router.post('/', async (req, res) => {
    try {
        const { membership_id, member_id, amount, payment_method, payment_status } = req.body;
        if (!membership_id || !member_id || !amount || !payment_method) {
            return res.status(400).json({ success: false, error: 'Please provide all required payment details.' });
        }

        const txId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const status = payment_status || 'Completed';

        const [result] = await db.query(`
            INSERT INTO payments (membership_id, member_id, amount, payment_date, payment_method, payment_status, transaction_id)
            VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?)
        `, [membership_id, member_id, amount, payment_method, status, txId]);

        res.json({ success: true, message: 'Payment recorded successfully.', payment_id: result.insertId, transaction_id: txId });
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/payments/:id/status - Update payment status (e.g. Pending -> Completed)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;
        if (!['Completed', 'Pending', 'Failed'].includes(payment_status)) {
            return res.status(400).json({ success: false, error: 'Invalid payment status.' });
        }

        await db.query('UPDATE payments SET payment_status = ? WHERE payment_id = ?', [payment_status, id]);
        res.json({ success: true, message: `Payment marked as ${payment_status}.` });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
