import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://mandel:mandel@localhost:5432/mandel',
});

export default pool;
