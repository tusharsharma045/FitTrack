const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/attendance - List attendance logs
router.get('/', async (req, res) => {
    try {
        const { date, member_id } = req.query;
        let query = `
            SELECT 
                a.attendance_id,
                a.attendance_date,
                a.check_in_time,
                a.check_out_time,
                TIMESTAMPDIFF(MINUTE, a.check_in_time, IFNULL(a.check_out_time, CURRENT_TIME)) AS duration_minutes,
                m.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.phone AS member_phone,
                m.email AS member_email
            FROM attendance a
            JOIN members m ON a.member_id = m.member_id
            WHERE 1=1
        `;
        const params = [];

        if (date) {
            query += ' AND a.attendance_date = ?';
            params.push(date);
        }

        if (member_id) {
            query += ' AND a.member_id = ?';
            params.push(member_id);
        }

        query += ' ORDER BY a.attendance_date DESC, a.check_in_time DESC LIMIT 100';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/quick-toggle - Smart Check-In/Check-Out via Stored Procedure
router.post('/quick-toggle', async (req, res) => {
    try {
        const { member_id } = req.body;
        if (!member_id) {
            return res.status(400).json({ success: false, error: 'Member ID is required.' });
        }

        await db.query('CALL sp_record_attendance(?, @action_taken, @out_status)', [member_id]);
        const [output] = await db.query('SELECT @action_taken AS action, @out_status AS status');
        const resData = output[0];

        if (resData.action === 'REJECTED') {
            return res.status(400).json({ success: false, error: resData.status });
        }

        res.json({
            success: true,
            action: resData.action,
            message: resData.status
        });
    } catch (error) {
        console.error('Attendance toggle error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/manual - Manual Log
router.post('/manual', async (req, res) => {
    try {
        const { member_id, attendance_date, check_in_time, check_out_time } = req.body;
        if (!member_id || !check_in_time) {
            return res.status(400).json({ success: false, error: 'Member ID and Check-in Time are required.' });
        }

        const date = attendance_date || new Date().toISOString().slice(0, 10);
        const [result] = await db.query(`
            INSERT INTO attendance (member_id, attendance_date, check_in_time, check_out_time)
            VALUES (?, ?, ?, ?)
        `, [member_id, date, check_in_time, check_out_time || null]);

        res.json({ success: true, message: 'Attendance record saved.', attendance_id: result.insertId });
    } catch (error) {
        console.error('Manual attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
