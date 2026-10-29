// Points integration tests at a throwaway `<db>_test` database so they never touch dev data.
import 'dotenv/config'
import { rmSync } from 'node:fs'
import pg from 'pg'

export default async function setup() {
  // Fresh scratch folder for test uploads, so leftovers from an interrupted run can't collide.
  rmSync('.test-media', { recursive: true, force: true })

  const base = new URL(process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/clarity60')
  const testDb = `${base.pathname.slice(1)}_test`

  const admin = new pg.Client({ connectionString: base.toString() })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS "${testDb}" WITH (FORCE)`)
  await admin.query(`CREATE DATABASE "${testDb}"`)
  await admin.end()

  base.pathname = `/${testDb}`
  process.env.DATABASE_URL = base.toString()
}
