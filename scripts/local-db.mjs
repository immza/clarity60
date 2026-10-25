// Runs a local Postgres 17 for development (no Docker needed).
// Data lives in ./.localdb (git-ignored). Stop with Ctrl+C.
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve('.localdb')
const isNew = !existsSync(dataDir)

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
})

if (isNew) await pg.initialise()
await pg.start()
if (isNew) await pg.createDatabase('clarity60')

console.log('Local Postgres running at postgresql://postgres:postgres@127.0.0.1:5432/clarity60')

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
