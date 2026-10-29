// Load .env, then force test-only settings (globalSetup already created the _test database).
import 'dotenv/config'

const url = new URL(process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/clarity60')
if (!url.pathname.endsWith('_test')) url.pathname = `${url.pathname}_test`
process.env.DATABASE_URL = url.toString()
process.env.PAYLOAD_DISABLE_TOTP = 'true'
process.env.DISABLE_JOBS = 'true'
// Tests must never touch real media storage, whatever the machine's environment holds.
delete process.env.S3_BUCKET
// Uploads in tests go to a scratch folder, emptied before each run (tests/globalSetup.ts).
process.env.MEDIA_DIR = '.test-media'
