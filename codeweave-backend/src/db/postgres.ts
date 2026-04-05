import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const connectDB = async () => {
  try {
    await pool.connect()
    console.log('Connected to PostgreSQL')
  } catch (error) {
    console.error('PostgreSQL connection error:', error)
  }
}
