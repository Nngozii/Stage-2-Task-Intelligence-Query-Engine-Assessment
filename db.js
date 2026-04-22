const { Pool } = require("ps");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
    
    )
    `)
