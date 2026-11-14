const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/memberships - List all memberships
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT 
                ms.membership_id,
                ms.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.email AS member_email,
                m.phone AS member_phone,
                mp.plan_id,
                mp.plan_name,
                mp.duration_months,
                ms.start_date,
                ms.end_date,
                ms.total_amount,
                ms.status,
                DATEDIFF(ms.end_date, CURRENT_DATE) AS days_remaining
            FROM memberships ms
            JOIN members m ON ms.member_id = m.member_id
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE 1=1
        `;
        const params = [];
        if (status && status !== 'All') {
            query += ' AND ms.status = ?';
            params.push(status);
        }
        query += ' ORDER BY ms.membership_id DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch memberships error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/memberships/expiring - Expiring memberships (next 10 days)
router.get('/expiring', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vw_expiring_memberships');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch expiring memberships error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/memberships/renew - Renew Membership via Stored Procedure
router.post('/renew', async (req, res) => {
    try {
        const { member_id, plan_id, payment_method } = req.body;
        if (!member_id || !plan_id) {
            return res.status(400).json({ success: false, error: 'Member and Plan are required.' });
        }

        const payMethod = payment_method || 'UPI';
        await db.query(
            'CALL sp_renew_membership(?, ?, ?, @out_membership_id, @out_status)',
            [member_id, plan_id, payMethod]
        );

        const [output] = await db.query('SELECT @out_membership_id AS membership_id, @out_status AS status');
        const resData = output[0];

        if (resData.status && resData.status.startsWith('ERROR')) {
            return res.status(400).json({ success: false, error: resData.status });
        }

        res.json({
            success: true,
            message: resData.status,
            membership_id: resData.membership_id
        });
    } catch (error) {
        console.error('Renew membership error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/memberships - Create new Membership subscription
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { member_id, plan_id, start_date, payment_method } = req.body;
        if (!member_id || !plan_id) {
            return res.status(400).json({ success: false, error: 'Member ID and Plan ID are required.' });
        }

        await connection.beginTransaction();

        // 1. Get plan details
        const [planRows] = await connection.query('SELECT duration_months, fee FROM membership_plans WHERE plan_id = ?', [plan_id]);
        if (planRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Membership plan not found.' });
        }
        const { duration_months, fee } = planRows[0];

        const startDate = start_date || new Date().toISOString().slice(0, 10);
        const [endDateResult] = await connection.query('SELECT DATE_ADD(?, INTERVAL ? MONTH) AS end_date', [startDate, duration_months]);
        const endDate = endDateResult[0].end_date;

        // 2. Insert membership
        const [msResult] = await connection.query(`
            INSERT INTO memberships (member_id, plan_id, start_date, end_date, total_amount, status)
            VALUES (?, ?, ?, ?, ?, 'Active')
        `, [member_id, plan_id, startDate, endDate, fee]);

        const membershipId = msResult.insertId;

        // 3. Create payment record
        const txId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await connection.query(`
            INSERT INTO payments (membership_id, member_id, amount, payment_date, payment_method, payment_status, transaction_id)
            VALUES (?, ?, ?, CURRENT_DATE, ?, 'Completed', ?)
        `, [membershipId, member_id, fee, payment_method || 'UPI', txId]);

        // 4. Update member to active
        await connection.query("UPDATE members SET status = 'Active' WHERE member_id = ?", [member_id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Membership activated and payment recorded.',
            membership_id: membershipId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create membership error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
