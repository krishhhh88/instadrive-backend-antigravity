const { Pool } = require('pg');

// The production connection string (Transaction Pooler)
const connectionString = 'postgresql://postgres.hlzsygylwshahkfhsxax:9669826028%40krish@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('Testing connection to:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Usually needed for Supabase/AWS
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

testConnection();
