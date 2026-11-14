const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Monthly Gym Revenue Report
router.get('/revenue', async (req, res) => {
    try {
        const [monthlyBreakdown] = await db.query(`
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') AS period,
                COUNT(payment_id) AS total_invoices,
                SUM(CASE WHEN payment_status = 'Completed' THEN amount ELSE 0 END) AS net_revenue,
                SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) AS pending_amount,
                SUM(CASE WHEN payment_status = 'Failed' THEN amount ELSE 0 END) AS failed_amount,
                ROUND(AVG(CASE WHEN payment_status = 'Completed' THEN amount ELSE NULL END), 2) AS average_ticket_size
            FROM payments
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ORDER BY period DESC;
        `);

        const [paymentMethods] = await db.query(`
            SELECT 
                payment_method,
                COUNT(payment_id) AS transaction_count,
                SUM(amount) AS total_volume
            FROM payments
            WHERE payment_status = 'Completed'
            GROUP BY payment_method
            ORDER BY total_volume DESC;
        `);

        res.json({ success: true, data: { monthlyBreakdown, paymentMethods } });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Trainer Performance Report
router.get('/trainers', async (req, res) => {
    try {
        const [trainers] = await db.query(`
            SELECT 
                t.trainer_id,
                CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
                t.specialization,
                t.experience_years,
                t.hourly_rate,
                t.status,
                COUNT(DISTINCT ta.member_id) AS total_clients_trained,
                SUM(CASE WHEN ta.status = 'Active' THEN 1 ELSE 0 END) AS current_active_clients,
                COUNT(DISTINCT wp.workout_plan_id) AS plans_designed,
                ROUND(COUNT(DISTINCT ta.member_id) * t.hourly_rate * 4, 2) AS estimated_monthly_earnings
            FROM trainers t
            LEFT JOIN trainer_assignments ta ON t.trainer_id = ta.trainer_id
            LEFT JOIN workout_plans wp ON t.trainer_id = wp.trainer_id
            GROUP BY t.trainer_id, t.first_name, t.last_name, t.specialization, t.experience_years, t.hourly_rate, t.status
            ORDER BY current_active_clients DESC, total_clients_trained DESC;
        `);
        res.json({ success: true, data: trainers });
    } catch (error) {
        console.error('Trainer analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Most Popular Workout Plans
router.get('/popular-workouts', async (req, res) => {
    try {
        const [workouts] = await db.query(`
            SELECT 
                wp.workout_plan_id,
                wp.plan_name,
                wp.goal,
                wp.difficulty_level,
                wp.duration_weeks,
                CONCAT(t.first_name, ' ', t.last_name) AS designer_trainer,
                COUNT(DISTINCT we.workout_exercise_id) AS total_exercises,
                COUNT(DISTINCT ta.member_id) AS members_following_trainer
            FROM workout_plans wp
            LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
            LEFT JOIN workout_exercises we ON wp.workout_plan_id = we.workout_plan_id
            LEFT JOIN trainer_assignments ta ON t.trainer_id = ta.trainer_id AND ta.status = 'Active'
            GROUP BY wp.workout_plan_id, wp.plan_name, wp.goal, wp.difficulty_level, wp.duration_weeks, t.first_name, t.last_name
            ORDER BY total_exercises DESC;
        `);
        res.json({ success: true, data: workouts });
    } catch (error) {
        console.error('Popular workouts analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Member Attendance Analytics
router.get('/attendance', async (req, res) => {
    try {
        // Attendance frequency tiers using Subquery and CASE
        const [frequencyTiers] = await db.query(`
            SELECT 
                activity_tier,
                COUNT(*) AS member_count
            FROM (
                SELECT 
                    m.member_id,
                    COUNT(a.attendance_id) AS visits,
                    CASE 
                        WHEN COUNT(a.attendance_id) >= 3 THEN 'Highly Active (3+ visits)'
                        WHEN COUNT(a.attendance_id) BETWEEN 1 AND 2 THEN 'Moderate (1-2 visits)'
                        ELSE 'Inactive / No Visits'
                    END AS activity_tier
                FROM members m
                LEFT JOIN attendance a ON m.member_id = a.member_id
                GROUP BY m.member_id
            ) AS member_visits
            GROUP BY activity_tier;
        `);

        // Peak workout hours of the day
        const [peakHours] = await db.query(`
            SELECT 
                HOUR(check_in_time) AS hour_of_day,
                COUNT(attendance_id) AS check_ins
            FROM attendance
            GROUP BY HOUR(check_in_time)
            ORDER BY hour_of_day ASC;
        `);

        res.json({ success: true, data: { frequencyTiers, peakHours } });
    } catch (error) {
        console.error('Attendance analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Pending Payments Report
router.get('/pending-payments', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                p.payment_id,
                p.transaction_id,
                p.amount,
                p.payment_date,
                p.payment_method,
                m.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.email,
                m.phone,
                mp.plan_name,
                DATEDIFF(CURRENT_DATE, p.payment_date) AS days_overdue
            FROM payments p
            JOIN members m ON p.member_id = m.member_id
            JOIN memberships ms ON p.membership_id = ms.membership_id
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE p.payment_status = 'Pending'
            ORDER BY p.amount DESC;
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Pending payments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Member Fitness Progress Comparison (Baseline vs Latest)
router.get('/progress-comparison', async (req, res) => {
    try {
        // Sophisticated correlated subqueries comparing member first checkup vs current checkup
        const [rows] = await db.query(`
            SELECT 
                m.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.gender,
                first_fp.recorded_date AS baseline_date,
                first_fp.weight_kg AS baseline_weight,
                first_fp.bmi AS baseline_bmi,
                latest_fp.recorded_date AS latest_date,
                latest_fp.weight_kg AS latest_weight,
                latest_fp.bmi AS latest_bmi,
                ROUND(latest_fp.weight_kg - first_fp.weight_kg, 2) AS weight_net_change,
                ROUND(latest_fp.bmi - first_fp.bmi, 2) AS bmi_net_change,
                CASE 
                    WHEN latest_fp.weight_kg < first_fp.weight_kg THEN 'Weight Reduction'
                    WHEN latest_fp.weight_kg > first_fp.weight_kg THEN 'Hypertrophy Gain'
                    ELSE 'Weight Maintained'
                END AS fitness_outcome
            FROM members m
            JOIN fitness_progress first_fp ON first_fp.progress_id = (
                SELECT progress_id FROM fitness_progress 
                WHERE member_id = m.member_id 
                ORDER BY recorded_date ASC, progress_id ASC LIMIT 1
            )
            JOIN fitness_progress latest_fp ON latest_fp.progress_id = (
                SELECT progress_id FROM fitness_progress 
                WHERE member_id = m.member_id 
                ORDER BY recorded_date DESC, progress_id DESC LIMIT 1
            )
            WHERE first_fp.progress_id <> latest_fp.progress_id
            ORDER BY ABS(latest_fp.weight_kg - first_fp.weight_kg) DESC;
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Progress comparison error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. Active vs Inactive Members Report
router.get('/active-vs-inactive', async (req, res) => {
    try {
        const [counts] = await db.query(`
            SELECT 
                status,
                COUNT(*) AS count,
                ROUND((COUNT(*) / (SELECT COUNT(*) FROM members)) * 100, 1) AS percentage
            FROM members
            GROUP BY status;
        `);

        const [inactiveList] = await db.query(`
            SELECT 
                m.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                m.email,
                m.phone,
                m.joined_date,
                MAX(ms.end_date) AS last_active_membership_date,
                DATEDIFF(CURRENT_DATE, IFNULL(MAX(ms.end_date), m.joined_date)) AS days_inactive
            FROM members m
            LEFT JOIN memberships ms ON m.member_id = ms.member_id
            WHERE m.status IN ('Inactive', 'Suspended')
            GROUP BY m.member_id, m.first_name, m.last_name, m.email, m.phone, m.joined_date
            ORDER BY days_inactive DESC;
        `);

        res.json({ success: true, data: { summary: counts, inactiveMembers: inactiveList } });
    } catch (error) {
        console.error('Active vs inactive error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
