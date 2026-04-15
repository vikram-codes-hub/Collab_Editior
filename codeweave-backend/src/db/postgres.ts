import { Pool } from 'pg'
import fs       from 'fs'
import path     from 'path'
import dotenv   from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const connectDB = async () => {
  try {
    await pool.connect()
    console.log('Connected to PostgreSQL')

    // Auto-run schema on startup
    const sqlPath = path.join(__dirname, 'init.sql')

    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8')
      await pool.query(sql)
      console.log('✅ PostgreSQL connected')
      console.log('✅ Schema applied')
    } else {
      console.warn('⚠️  init.sql not found, skipping schema')
      console.log('✅ PostgreSQL connected')
    }

  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err)
    process.exit(1)
  }
}