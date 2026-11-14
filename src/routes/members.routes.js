const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/members - List members with search and status filter
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
            SELECT 
                m.member_id,
                m.first_name,
                m.last_name,
                CONCAT(m.first_name, ' ', m.last_name) AS full_name,
                m.email,
                m.phone,
                m.gender,
                m.dob,
                m.emergency_contact,
                m.address,
                m.joined_date,
                m.status,
                mp.plan_name AS active_plan,
                ms.end_date AS plan_end_date,
                DATEDIFF(ms.end_date, CURRENT_DATE) AS days_remaining,
                CONCAT(t.first_name, ' ', t.last_name) AS assigned_trainer
            FROM members m
            LEFT JOIN memberships ms ON m.member_id = ms.member_id AND ms.status = 'Active' AND ms.end_date >= CURRENT_DATE
            LEFT JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            LEFT JOIN trainer_assignments ta ON m.member_id = ta.member_id AND ta.status = 'Active'
            LEFT JOIN trainers t ON ta.trainer_id = t.trainer_id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'All') {
            query += ' AND m.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ? OR m.phone LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY m.member_id DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch members error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/members/:id - Deep Profile with Subqueries and Joins
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Core Profile
        const [memberRows] = await db.query('SELECT *, fn_get_member_total_spent(?) AS total_spent FROM members WHERE member_id = ?', [id, id]);
        if (memberRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Member not found' });
        }
        const member = memberRows[0];

        // 2. Memberships History
        const [memberships] = await db.query(`
            SELECT ms.*, mp.plan_name, mp.duration_months
            FROM memberships ms
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE ms.member_id = ?
            ORDER BY ms.start_date DESC
        `, [id]);

        // 3. Trainer Assignments
        const [trainers] = await db.query(`
            SELECT ta.*, CONCAT(t.first_name, ' ', t.last_name) AS trainer_name, t.specialization, t.phone AS trainer_phone
            FROM trainer_assignments ta
            JOIN trainers t ON ta.trainer_id = t.trainer_id
            WHERE ta.member_id = ?
            ORDER BY ta.assigned_date DESC
        `, [id]);

        // 4. Attendance Records (Last 10)
        const [attendance] = await db.query(`
            SELECT * FROM attendance
            WHERE member_id = ?
            ORDER BY attendance_date DESC, check_in_time DESC
            LIMIT 10
        `, [id]);

        // 5. Fitness Progress Logs
        const [progress] = await db.query(`
            SELECT * FROM fitness_progress
            WHERE member_id = ?
            ORDER BY recorded_date DESC
        `, [id]);

        // 6. Payment History
        const [payments] = await db.query(`
            SELECT * FROM payments
            WHERE member_id = ?
            ORDER BY payment_date DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                member,
                memberships,
                trainers,
                attendance,
                progress,
                payments
            }
        });
    } catch (error) {
        console.error('Member profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/members - Register Member with Plan (Utilizes Stored Procedure sp_register_member_with_membership)
router.post('/', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            gender,
            dob,
            emergency_contact,
            address,
            plan_id,
            payment_method
        } = req.body;

        if (!first_name || !last_name || !email || !phone || !gender || !dob || !emergency_contact) {
            return res.status(400).json({ success: false, error: 'Please provide all required fields.' });
        }

        // If plan_id is provided, execute atomic Stored Procedure transaction
        if (plan_id) {
            const payMethod = payment_method || 'UPI';
            const [result] = await db.query(
                'CALL sp_register_member_with_membership(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @out_member_id, @out_membership_id, @out_status)',
                [first_name, last_name, email, phone, gender, dob, emergency_contact, address || '', plan_id, payMethod]
            );

            const [output] = await db.query('SELECT @out_member_id AS member_id, @out_membership_id AS membership_id, @out_status AS status');
            const resData = output[0];

            if (resData.status && resData.status.startsWith('ERROR')) {
                return res.status(400).json({ success: false, error: resData.status });
            }

            return res.json({
                success: true,
                message: resData.status,
                member_id: resData.member_id,
                membership_id: resData.membership_id
            });
        } else {
            // Direct insertion without plan
            const [insertResult] = await db.query(`
                INSERT INTO members (first_name, last_name, email, phone, gender, dob, emergency_contact, address, joined_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 'Active')
            `, [first_name, last_name, email, phone, gender, dob, emergency_contact, address || '']);

            return res.json({
                success: true,
                message: 'Member registered successfully without initial plan.',
                member_id: insertResult.insertId
            });
        }
    } catch (error) {
        console.error('Member registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'A member with this email or phone already exists.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/members/:id - Update Member details
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, gender, dob, emergency_contact, address, status } = req.body;

        await db.query(`
            UPDATE members
            SET first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, dob = ?, emergency_contact = ?, address = ?, status = ?
            WHERE member_id = ?
        `, [first_name, last_name, email, phone, gender, dob, emergency_contact, address, status || 'Active', id]);

        res.json({ success: true, message: 'Member updated successfully.' });
    } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/members/:id - Delete Member (Cascades to related records)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM members WHERE member_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Member not found.' });
        }
        res.json({ success: true, message: 'Member and associated records deleted successfully.' });
    } catch (error) {
        console.error('Delete member error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
