const mysql = require('mysql2/promise');
require('dotenv').config();

// Dual configuration definitions
const DOCKER_CONFIG = {
    host: 'localhost',
    port: 3307,
    user: 'mysql',
    password: 'mysql123',
    database: 'fittrack_db'
};

const LOCAL_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'fittrack_db'
};

// Create a flexible proxy connection pool that auto-selects or respects .env
let activePool = null;

function createPoolConfig(cfg) {
    return mysql.createPool({
        host: cfg.host,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        port: cfg.port,
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        decimalNumbers: true
    });
}

// Determine default target from .env
const envPort = Number(process.env.DB_PORT);
if (envPort === 3306) {
    activePool = createPoolConfig(LOCAL_CONFIG);
} else if (envPort === 3307) {
    activePool = createPoolConfig(DOCKER_CONFIG);
} else if (process.env.DATABASE_URL) {
    activePool = mysql.createPool(process.env.DATABASE_URL);
} else {
    // Default to Docker 3307 with automatic fallback to Local 3306
    activePool = createPoolConfig(DOCKER_CONFIG);
}

// Connection test and fallback
async function getActiveConnection() {
    try {
        const conn = await activePool.getConnection();
        return conn;
    } catch (primaryErr) {
        // If primary failed on 3307, try local 3306
        if (activePool.pool.config.connectionConfig.port === 3307) {
            console.log('  ⚠️  Docker MySQL (3307) unavailable, switching to Native Local MySQL (3306)...');
            activePool = createPoolConfig(LOCAL_CONFIG);
            const fallbackConn = await activePool.getConnection();
            console.log('  ✅ Connected to Native Local MySQL (3306).');
            return fallbackConn;
        } else if (activePool.pool.config.connectionConfig.port === 3306) {
            console.log('  ⚠️  Native Local MySQL (3306) unavailable, switching to Docker MySQL (3307)...');
            activePool = createPoolConfig(DOCKER_CONFIG);
            const fallbackConn = await activePool.getConnection();
            console.log('  ✅ Connected to Docker MySQL (3307).');
            return fallbackConn;
        }
        throw primaryErr;
    }
}

// Proxy wrapper so existing db.query() and db.getConnection() work seamlessly
const dbProxy = {
    async query(sql, params) {
        try {
            return await activePool.query(sql, params);
        } catch (err) {
            // Attempt auto-switch on connection failure
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                const conn = await getActiveConnection();
                conn.release();
                return await activePool.query(sql, params);
            }
            throw err;
        }
    },
    async getConnection() {
        return await getActiveConnection();
    },
    get activePort() {
        return activePool?.pool?.config?.connectionConfig?.port || 3307;
    },
    get activeUser() {
        return activePool?.pool?.config?.connectionConfig?.user || 'mysql';
    }
};

module.exports = dbProxy;
