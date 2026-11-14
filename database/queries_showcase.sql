-- ==============================================================================
-- PROJECT: FitTrack – Smart Gym Management & Fitness Tracking System
-- MODULE: Capstone SQL Demonstration Script (queries_showcase.sql)
-- PURPOSE: University DBMS Evaluation - Advanced SQL Proof & Demonstration
-- ==============================================================================

USE fittrack_db;

-- ==============================================================================
-- DEMO 1: COMPLEX JOINS (INNER, LEFT, RIGHT)
-- ==============================================================================

-- 1.1 INNER JOIN: Get all active members, their current plan details and assigned trainer
SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.phone,
    mp.plan_name,
    ms.start_date,
    ms.end_date,
    CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
    t.specialization
FROM members m
INNER JOIN memberships ms ON m.member_id = ms.member_id
INNER JOIN membership_plans mp ON ms.plan_id = mp.plan_id
INNER JOIN trainer_assignments ta ON m.member_id = ta.member_id
INNER JOIN trainers t ON ta.trainer_id = t.trainer_id
WHERE ms.status = 'Active' AND ta.status = 'Active';

-- 1.2 LEFT JOIN: List all trainers including those who currently have 0 assigned members
SELECT 
    t.trainer_id,
    CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
    t.specialization,
    t.hourly_rate,
    COUNT(ta.assignment_id) AS total_assigned_clients,
    GROUP_CONCAT(CONCAT(m.first_name, ' ', m.last_name) SEPARATOR ', ') AS client_names
FROM trainers t
LEFT JOIN trainer_assignments ta ON t.trainer_id = ta.trainer_id AND ta.status = 'Active'
LEFT JOIN members m ON ta.member_id = m.member_id
GROUP BY t.trainer_id, t.first_name, t.last_name, t.specialization, t.hourly_rate;

-- 1.3 RIGHT JOIN: List all exercises and which workout plans include them (including exercises in 0 plans)
SELECT 
    e.exercise_name,
    e.muscle_group,
    e.difficulty_level,
    wp.plan_name,
    we.day_of_week,
    we.sets,
    we.reps
FROM workout_exercises we
JOIN workout_plans wp ON we.workout_plan_id = wp.workout_plan_id
RIGHT JOIN exercises e ON we.exercise_id = e.exercise_id
ORDER BY e.muscle_group, e.exercise_name;

-- ==============================================================================
-- DEMO 2: AGGREGATE FUNCTIONS, GROUP BY & HAVING
-- ==============================================================================

-- 2.1 Revenue performance by Membership Plan with MIN, MAX, AVG and SUM
SELECT 
    mp.plan_name,
    mp.duration_months,
    mp.fee,
    COUNT(ms.membership_id) AS total_subscriptions_sold,
    MIN(ms.total_amount) AS min_paid,
    MAX(ms.total_amount) AS max_paid,
    ROUND(AVG(ms.total_amount), 2) AS average_amount,
    SUM(ms.total_amount) AS total_revenue_generated
FROM membership_plans mp
LEFT JOIN memberships ms ON mp.plan_id = ms.plan_id
GROUP BY mp.plan_id, mp.plan_name, mp.duration_months, mp.fee
HAVING total_subscriptions_sold > 0
ORDER BY total_revenue_generated DESC;

-- 2.2 Highly active trainers having more than 1 active client
SELECT 
    t.trainer_id,
    CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
    t.specialization,
    COUNT(ta.member_id) AS active_member_count
FROM trainers t
JOIN trainer_assignments ta ON t.trainer_id = ta.trainer_id
WHERE ta.status = 'Active'
GROUP BY t.trainer_id, t.first_name, t.last_name, t.specialization
HAVING active_member_count >= 2
ORDER BY active_member_count DESC;

-- ==============================================================================
-- DEMO 3: SUBQUERIES AND NESTED QUERIES
-- ==============================================================================

-- 3.1 Non-correlated Subquery: Members who have spent more than the average gym member
SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.email,
    SUM(p.amount) AS total_spent
FROM members m
JOIN payments p ON m.member_id = p.member_id
WHERE p.payment_status = 'Completed'
GROUP BY m.member_id, m.first_name, m.last_name, m.email
HAVING total_spent > (
    SELECT AVG(member_total) 
    FROM (
        SELECT SUM(amount) AS member_total
        FROM payments
        WHERE payment_status = 'Completed'
        GROUP BY member_id
    ) AS avg_expenditure
)
ORDER BY total_spent DESC;

-- 3.2 Correlated Subquery: Find members whose latest BMI is lower than their baseline initial BMI (Weight loss winners)
SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    (SELECT bmi FROM fitness_progress fp_first 
     WHERE fp_first.member_id = m.member_id 
     ORDER BY recorded_date ASC LIMIT 1) AS initial_bmi,
    (SELECT bmi FROM fitness_progress fp_latest 
     WHERE fp_latest.member_id = m.member_id 
     ORDER BY recorded_date DESC LIMIT 1) AS current_bmi
FROM members m
WHERE (
    SELECT bmi FROM fitness_progress fp_latest 
    WHERE fp_latest.member_id = m.member_id 
    ORDER BY recorded_date DESC LIMIT 1
) < (
    SELECT bmi FROM fitness_progress fp_first 
    WHERE fp_first.member_id = m.member_id 
    ORDER BY recorded_date ASC LIMIT 1
);

-- ==============================================================================
-- DEMO 4: COMMON TABLE EXPRESSIONS (CTEs)
-- ==============================================================================

-- 4.1 CTE: Member Engagement Ranking combining attendance and workout dedication
WITH MemberAttendanceMetrics AS (
    SELECT 
        member_id,
        COUNT(attendance_id) AS visit_count,
        MAX(attendance_date) AS last_seen
    FROM attendance
    GROUP BY member_id
),
MemberFinancialMetrics AS (
    SELECT 
        member_id,
        SUM(amount) AS total_paid
    FROM payments
    WHERE payment_status = 'Completed'
    GROUP BY member_id
)
SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.status AS membership_status,
    COALESCE(mam.visit_count, 0) AS total_visits,
    mam.last_seen,
    COALESCE(mfm.total_paid, 0.00) AS lifetime_value
FROM members m
LEFT JOIN MemberAttendanceMetrics mam ON m.member_id = mam.member_id
LEFT JOIN MemberFinancialMetrics mfm ON m.member_id = mfm.member_id
ORDER BY total_visits DESC, lifetime_value DESC;

-- 4.2 CTE with Window Function: Track Weight Progression delta between checkups
WITH ProgressSequence AS (
    SELECT 
        progress_id,
        member_id,
        recorded_date,
        weight_kg,
        bmi,
        LAG(weight_kg, 1) OVER (PARTITION BY member_id ORDER BY recorded_date ASC) AS previous_weight,
        LAG(bmi, 1) OVER (PARTITION BY member_id ORDER BY recorded_date ASC) AS previous_bmi
    FROM fitness_progress
)
SELECT 
    m.first_name,
    m.last_name,
    ps.recorded_date,
    ps.weight_kg AS current_weight,
    ps.previous_weight,
    ROUND(ps.weight_kg - ps.previous_weight, 2) AS weight_difference_kg,
    ps.bmi AS current_bmi,
    ROUND(ps.bmi - ps.previous_bmi, 2) AS bmi_change
FROM ProgressSequence ps
JOIN members m ON ps.member_id = m.member_id
WHERE ps.previous_weight IS NOT NULL
ORDER BY m.member_id, ps.recorded_date ASC;

-- ==============================================================================
-- DEMO 5: WINDOW FUNCTIONS (RANK, ROW_NUMBER)
-- ==============================================================================

-- Rank trainers by hourly rate within their experience tiers
SELECT 
    trainer_id,
    CONCAT(first_name, ' ', last_name) AS trainer_name,
    specialization,
    experience_years,
    hourly_rate,
    DENSE_RANK() OVER (ORDER BY hourly_rate DESC) AS rate_rank,
    ROW_NUMBER() OVER (ORDER BY experience_years DESC) AS experience_seniority_rank
FROM trainers;

-- ==============================================================================
-- DEMO 6: CALLING USER-DEFINED FUNCTIONS & STORED PROCEDURES
-- ==============================================================================

-- 6.1 User-Defined Functions:
SELECT 
    member_id,
    first_name,
    last_name,
    fn_get_member_total_spent(member_id) AS total_invested
FROM members
LIMIT 5;

-- Calculate BMI on the fly:
SELECT fn_calculate_bmi(75.5, 175.0) AS calculated_bmi;

-- 6.2 Calling Stored Procedure: sp_record_attendance
-- Call procedure to simulate daily check-in / check-out:
CALL sp_record_attendance(1, @action, @msg);
SELECT @action AS attendance_action, @msg AS result_message;

-- ==============================================================================
-- DEMO 7: TRANSACTIONS WITH COMMIT, ROLLBACK & SAVEPOINT
-- ==============================================================================

-- Demonstration of manual transaction control with SAVEPOINT:
START TRANSACTION;

INSERT INTO membership_plans (plan_name, description, duration_months, fee, status)
VALUES ('Demo Test Plan', 'Temporary plan for transaction demo', 1, 999.00, 'Active');

SAVEPOINT sp_after_plan_insert;

-- Intentional test insert that might need partial cancellation
INSERT INTO membership_plans (plan_name, description, duration_months, fee, status)
VALUES ('Corrupt Test Plan', 'Plan to test rollback', 2, 1999.00, 'Inactive');

-- Rollback to savepoint: cancels corrupt insert but keeps demo plan
ROLLBACK TO SAVEPOINT sp_after_plan_insert;

-- Finally rollback the entire test demo to keep database pristine
ROLLBACK;
