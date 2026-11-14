const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'fittrack_db';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database pool
const db = require('./src/config/db');

// Route Handlers
const dashboardRoutes = require('./src/routes/dashboard.routes');
const membersRoutes = require('./src/routes/members.routes');
const trainersRoutes = require('./src/routes/trainers.routes');
const plansRoutes = require('./src/routes/plans.routes');
const membershipsRoutes = require('./src/routes/memberships.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const paymentsRoutes = require('./src/routes/payments.routes');
const workoutsRoutes = require('./src/routes/workouts.routes');
const progressRoutes = require('./src/routes/progress.routes');
const equipmentRoutes = require('./src/routes/equipment.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const dbmsDemoRoutes = require('./src/routes/dbms_demo.routes');

// API Mounts
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dbms-demo', dbmsDemoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        app: 'FitTrack – Smart Gym Management System',
        database: 'MySQL 8',
        dbName: DB_NAME,
        timestamp: new Date().toISOString()
    });
});

// Single Page Application Fallback for unhandled frontend routes
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    next();
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Helper function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Start Server
const server = app.listen(PORT, '0.0.0.0', async () => {
    const localIP = getLocalIP();
    
    // Verify DB Connection
    let dbStatus = `MySQL 8 Connected (${DB_NAME})`;
    let portType = db.activePort === 3307 ? 'Docker MySQL (port 3307)' : 'Native Local MySQL (port 3306)';
    try {
        const conn = await db.getConnection();
        conn.release();
        dbStatus = `MySQL 8 Connected: ${portType}`;
    } catch (e) {
        dbStatus = `MySQL Connection Warning: ${e.message}`;
    }

    console.log('\n  \x1b[1m\x1b[32mFITTRACK GYM MANAGEMENT & FITNESS TRACKING SYSTEM\x1b[0m');
    console.log(`  \x1b[90m${dbStatus}\x1b[0m\n`);
    console.log(`  \x1b[1m➜\x1b[0m  \x1b[1mLocal:\x1b[0m    \x1b[36mhttp://localhost:${PORT}/\x1b[0m`);
    console.log(`  \x1b[1m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m  \x1b[36mhttp://${localIP}:${PORT}/\x1b[0m\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is busy. Free it with: fuser -k ${PORT}/tcp or run: PORT=3001 npm run dev\n`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
