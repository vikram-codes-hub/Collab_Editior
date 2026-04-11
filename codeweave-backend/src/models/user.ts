import { pool } from '../db/postgres'
import bcrypt from 'bcrypt'
import { AppError } from '../middleware/error'

/* User Model — all DB queries for users table */

export interface User {
  id:         string
  email:      string
  username:   string
  created_at: Date
}

export interface CreateUserInput {
  email:    string
  username: string
  password: string
}

/* Create user */
export const createUser = async (
  input: CreateUserInput
): Promise<User> => {
  const { email, username, password } = input

  // Check if email already exists
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )
  if (existing.rows[0]) {
    throw new AppError('Email already in use', 409)
  }

  const hash = await bcrypt.hash(password, 12)

  const { rows } = await pool.query(
    `INSERT INTO users (email, username, password)
     VALUES ($1, $2, $3)
     RETURNING id, email, username, created_at`,
    [email, username, hash]
  )

  return rows[0]
}

/* Find user by email (includes password for auth) */
export const findUserByEmail = async (email: string) => {
  const { rows } = await pool.query(
    `SELECT id, email, username, password, created_at
     FROM users WHERE email = $1`,
    [email]
  )
  return rows[0] ?? null
}

/* Find user by ID (no password) */
export const findUserById = async (id: string): Promise<User | null> => {
  const { rows } = await pool.query(
    `SELECT id, email, username, created_at
     FROM users WHERE id = $1`,
    [id]
  )
  return rows[0] ?? null
}

/* Verify password*/
export const verifyPassword = async (
  plain:  string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed)
}

/* Update user*/
export const updateUser = async (
  id:    string,
  input: Partial<{ username: string; email: string }>
): Promise<User> => {
  const fields: string[] = []
  const values: any[]    = []
  let   idx              = 1

  if (input.username) {
    fields.push(`username = $${idx++}`)
    values.push(input.username)
  }
  if (input.email) {
    fields.push(`email = $${idx++}`)
    values.push(input.email)
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400)
  }

  values.push(id)

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING id, email, username, created_at`,
    values
  )

  if (!rows[0]) throw new AppError('User not found', 404)
  return rows[0]
}

/*Delete user  */
export const deleteUser = async (id: string): Promise<void> => {
  const { rowCount } = await pool.query(
    'DELETE FROM users WHERE id = $1',
    [id]
  )
  if (!rowCount) throw new AppError('User not found', 404)
}