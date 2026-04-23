const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name VARCHAR UNIQUE,
    gender VARCHAR,
    gender_probability FLOAT,
    age INT,
    age_group VARCHAR,
    country_id VARCHAR(2),
    country_name VARCHAR,
    country_probability FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
    )
    `);

module.exports = pool;
