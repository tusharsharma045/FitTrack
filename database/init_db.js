// ==============================================================================
// FitTrack - Automated Database Initialization & Verification Script
// ==============================================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
    console.log('--------------------------------------------------');
    console.log('   FitTrack DBMS - Database Setup & Seeding');
    console.log('--------------------------------------------------');

    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_PORT === '3307' ? 'root' : (process.env.DB_USER || 'root');
    const password = process.env.DB_PORT === '3307' ? 'rootpassword' : (process.env.DB_PASSWORD || 'root');
    const port = Number(process.env.DB_PORT) || 3307;

    console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);

    let connection;
    try {
        // Connect to server (without initial DB selection to allow CREATE DATABASE)
        connection = await mysql.createConnection({
            host,
            user,
            password,
            port,
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const seedsPath = path.join(__dirname, 'seeds.sql');

        console.log('Reading schema.sql...');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        // Clean out DELIMITER commands for mysql2 multipleStatements execution
        const cleanedSchema = schemaSQL
            .replace(/DELIMITER \$\$/g, '')
            .replace(/DELIMITER ;/g, '')
            .replace(/\$\$/g, ';');

        console.log('Executing schema.sql DDL (Tables, Views, Triggers, Procedures, UDFs)...');
        await connection.query(cleanedSchema);
        console.log('Schema executed successfully!');

        console.log('Reading seeds.sql...');
        const seedsSQL = fs.readFileSync(seedsPath, 'utf8');

        console.log('Executing seeds.sql (Sample records across 12 tables)...');
        await connection.query(seedsSQL);
        console.log('Seeds inserted successfully!');

        // Run Verification Queries
        await connection.changeUser({ database: 'fittrack_db' });
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`\nVerified Tables in fittrack_db (${tables.length} objects):`);
        tables.forEach((row, idx) => {
            console.log(`  ${idx + 1}. ${Object.values(row)[0]}`);
        });

        // Test one of the Views
        const [viewsData] = await connection.query('SELECT * FROM vw_monthly_revenue_summary LIMIT 2');
        console.log('\nVerified vw_monthly_revenue_summary view:');
        console.table(viewsData);

        // Test User Defined Function
        const [funcTest] = await connection.query('SELECT fn_calculate_bmi(70, 175) AS sample_bmi');
        console.log(`Verified fn_calculate_bmi(70kg, 175cm) = ${funcTest[0].sample_bmi}`);

        console.log('\nFitTrack Database is READY and FULLY VERIFIED!\n');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

run();
