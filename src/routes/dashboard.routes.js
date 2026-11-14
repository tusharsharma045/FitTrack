const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/dashboard/summary - Key Metric Cards
router.get('/summary', async (req, res) => {
    try {
        // Run parallel queries using SQL aggregates
        const [totalMembers] = await db.query('SELECT COUNT(*) AS count FROM members');
        const [activeMemberships] = await db.query("SELECT COUNT(*) AS count FROM memberships WHERE status = 'Active'");
        const [expiredMemberships] = await db.query("SELECT COUNT(*) AS count FROM memberships WHERE status = 'Expired'");
        const [totalTrainers] = await db.query("SELECT COUNT(*) AS count FROM trainers WHERE status = 'Active'");
        const [todayAttendance] = await db.query('SELECT COUNT(*) AS count FROM attendance WHERE attendance_date = CURRENT_DATE');
        const [monthlyRevenue] = await db.query(`
            SELECT IFNULL(SUM(amount), 0) AS total 
            FROM payments 
            WHERE payment_status = 'Completed' 
              AND MONTH(payment_date) = MONTH(CURRENT_DATE) 
              AND YEAR(payment_date) = YEAR(CURRENT_DATE)
        `);
        const [pendingPayments] = await db.query(`
            SELECT IFNULL(SUM(amount), 0) AS total, COUNT(*) AS count 
            FROM payments 
            WHERE payment_status = 'Pending'
        `);

        // Expiring memberships alert (next 10 days)
        const [expiringList] = await db.query('SELECT * FROM vw_expiring_memberships LIMIT 5');

        // Equipment needing attention
        const [equipmentAlerts] = await db.query('SELECT * FROM vw_equipment_maintenance_alert LIMIT 5');

        res.json({
            success: true,
            data: {
                totalMembers: totalMembers[0].count,
                activeMemberships: activeMemberships[0].count,
                expiredMemberships: expiredMemberships[0].count,
                totalTrainers: totalTrainers[0].count,
                todayAttendance: todayAttendance[0].count,
                monthlyRevenue: Number(monthlyRevenue[0].total).toFixed(2),
                pendingPayments: {
                    total: Number(pendingPayments[0].total).toFixed(2),
                    count: pendingPayments[0].count
                },
                alerts: {
                    expiringMemberships: expiringList,
                    equipmentAlerts: equipmentAlerts
                }
            }
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/charts - Chart.js Datasets
router.get('/charts', async (req, res) => {
    try {
        // 1. Revenue trends by month (Last 6 months using vw_monthly_revenue_summary)
        const [monthlyRev] = await db.query(`
            SELECT revenue_month, total_collected, total_pending
            FROM vw_monthly_revenue_summary
            ORDER BY revenue_month ASC
            LIMIT 6
        `);

        // 2. Membership distribution by Plan Name
        const [planDistribution] = await db.query(`
            SELECT mp.plan_name, COUNT(ms.membership_id) AS subscription_count
            FROM membership_plans mp
            LEFT JOIN memberships ms ON mp.plan_id = ms.plan_id
            GROUP BY mp.plan_id, mp.plan_name
            ORDER BY subscription_count DESC
        `);

        // 3. Attendance activity over last 7 days
        const [attendanceTrend] = await db.query(`
            SELECT 
                DATE_FORMAT(attendance_date, '%a (%d %b)') AS label,
                attendance_date,
                COUNT(attendance_id) AS visits
            FROM attendance
            WHERE attendance_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
            GROUP BY attendance_date
            ORDER BY attendance_date ASC
        `);

        // 4. Equipment condition distribution
        const [equipStatus] = await db.query(`
            SELECT condition_status, COUNT(*) AS count
            FROM gym_equipment
            GROUP BY condition_status
        `);

        res.json({
            success: true,
            data: {
                monthlyRevenue: monthlyRev,
                planDistribution: planDistribution,
                attendanceTrend: attendanceTrend,
                equipmentStatus: equipStatus
            }
        });
    } catch (error) {
        console.error('Dashboard charts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
