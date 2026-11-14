const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Catalog of preset DBMS demonstration queries for professors & evaluators
const DBMS_DEMOS = {
    joins: {
        title: 'Multi-Table Joins (INNER, LEFT, RIGHT)',
        description: 'Combines members, active memberships, membership plans, and trainer assignments into a unified operational dataset.',
        sql: `SELECT 
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
LEFT JOIN trainer_assignments ta ON m.member_id = ta.member_id AND ta.status = 'Active'
LEFT JOIN trainers t ON ta.trainer_id = t.trainer_id
WHERE ms.status = 'Active'
ORDER BY ms.end_date ASC;`
    },
    aggregates: {
        title: 'Aggregates with GROUP BY & HAVING Clause',
        description: 'Calculates financial statistics (MIN, MAX, AVG, SUM) grouped by membership plans, filtering only plans generating revenue.',
        sql: `SELECT 
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
ORDER BY total_revenue_generated DESC;`
    },
    subqueries: {
        title: 'Correlated & Non-Correlated Subqueries',
        description: 'Finds gym members who have spent more than the overall average member lifetime spend.',
        sql: `SELECT 
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
ORDER BY total_spent DESC;`
    },
    ctes: {
        title: 'Common Table Expressions (CTEs) & Window Functions (LAG)',
        description: 'Uses a CTE with the LAG() window function to compute member weight and BMI progression between consecutive assessments.',
        sql: `WITH ProgressSequence AS (
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
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    ps.recorded_date,
    ps.weight_kg AS current_weight,
    ps.previous_weight,
    ROUND(ps.weight_kg - ps.previous_weight, 2) AS weight_delta_kg,
    ps.bmi AS current_bmi,
    ROUND(ps.bmi - ps.previous_bmi, 2) AS bmi_delta
FROM ProgressSequence ps
JOIN members m ON ps.member_id = m.member_id
WHERE ps.previous_weight IS NOT NULL
ORDER BY m.member_id, ps.recorded_date ASC;`
    },
    ranking: {
        title: 'Window Functions (DENSE_RANK & ROW_NUMBER)',
        description: 'Ranks personal trainers by hourly compensation and experience seniority.',
        sql: `SELECT 
    trainer_id,
    CONCAT(first_name, ' ', last_name) AS trainer_name,
    specialization,
    experience_years,
    hourly_rate,
    DENSE_RANK() OVER (ORDER BY hourly_rate DESC) AS fee_rank,
    ROW_NUMBER() OVER (ORDER BY experience_years DESC) AS seniority_rank
FROM trainers;`
    },
    udf: {
        title: 'User-Defined Functions (UDF) Execution',
        description: 'Demonstrates invoking fn_calculate_bmi() and fn_get_member_total_spent() directly in SQL.',
        sql: `SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.email,
    fn_get_member_total_spent(m.member_id) AS total_invested_in_gym,
    fn_calculate_bmi(72.5, 175.0) AS calculated_sample_bmi
FROM members m
LIMIT 5;`
    }
};

// GET /api/dbms-demo/catalog - Return demo definitions
router.get('/catalog', (req, res) => {
    res.json({ success: true, data: DBMS_DEMOS });
});

// POST /api/dbms-demo/run - Execute a demo query or custom SELECT query
router.post('/run', async (req, res) => {
    try {
        const { key, customQuery } = req.body;
        let queryToRun = '';
        let queryMeta = {};

        if (key && DBMS_DEMOS[key]) {
            queryToRun = DBMS_DEMOS[key].sql;
            queryMeta = {
                title: DBMS_DEMOS[key].title,
                description: DBMS_DEMOS[key].description
            };
        } else if (customQuery) {
            const trimmed = customQuery.trim();
            // Restrict custom queries to SELECT or SHOW or CALL or WITH for safety
            if (!/^(SELECT|SHOW|WITH|CALL|EXPLAIN)\s/i.test(trimmed)) {
                return res.status(400).json({ success: false, error: 'Only read-only queries (SELECT, SHOW, WITH, CALL, EXPLAIN) are permitted in demo runner.' });
            }
            queryToRun = trimmed;
            queryMeta = {
                title: 'Custom Query Execution',
                description: 'User-defined SQL execution'
            };
        } else {
            return res.status(400).json({ success: false, error: 'No query specified.' });
        }

        const startTime = process.hrtime();
        const [rows, fields] = await db.query(queryToRun);
        const diff = process.hrtime(startTime);
        const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

        // Normalize if result is nested (from CALL procedure)
        const finalRows = Array.isArray(rows[0]) ? rows[0] : rows;
        const columnNames = fields && fields.map ? fields.map(f => f.name) : (finalRows.length > 0 ? Object.keys(finalRows[0]) : []);

        res.json({
            success: true,
            meta: queryMeta,
            sql: queryToRun,
            executionTimeMs: `${executionTimeMs} ms`,
            rowCount: finalRows.length,
            columns: columnNames,
            data: finalRows
        });
    } catch (error) {
        console.error('Demo query execution error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dbms-demo/schema - Inspect Database Tables and Constraints Metadata
router.get('/schema', async (req, res) => {
    try {
        const [tables] = await db.query(`
            SELECT 
                TABLE_NAME, 
                TABLE_ROWS, 
                DATA_LENGTH, 
                ENGINE, 
                TABLE_COLLATION 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'fittrack_db' AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME;
        `);

        const [foreignKeys] = await db.query(`
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = 'fittrack_db' AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME;
        `);

        const [triggers] = await db.query(`
            SELECT 
                TRIGGER_NAME, 
                EVENT_MANIPULATION, 
                EVENT_OBJECT_TABLE, 
                ACTION_TIMING
            FROM INFORMATION_SCHEMA.TRIGGERS
            WHERE TRIGGER_SCHEMA = 'fittrack_db';
        `);

        const [routines] = await db.query(`
            SELECT 
                ROUTINE_NAME, 
                ROUTINE_TYPE, 
                DTD_IDENTIFIER
            FROM INFORMATION_SCHEMA.ROUTINES
            WHERE ROUTINE_SCHEMA = 'fittrack_db';
        `);

        res.json({
            success: true,
            data: {
                tables,
                foreignKeys,
                triggers,
                routines
            }
        });
    } catch (error) {
        console.error('Schema inspection error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
