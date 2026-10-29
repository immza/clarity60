/**
 * TLS settings for the database pool. Any database that isn't on this machine must use
 * certificate-verified TLS (the provider's CA in DATABASE_CA_CERT; identity checked).
 *
 * The Postgres driver lets query parameters in the connection string (?host=, ?sslmode=,
 * ?ssl=...) override both the URL's host and our TLS options. Such parameters are rejected
 * outright, so neither the "local" exception nor the TLS requirement can be bypassed by
 * editing the URL.
 */
const OVERRIDE_PARAMS = ['host', 'hostaddr', 'port', 'ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslnegotiation', 'uselibpqcompat']
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export const databaseTls = (databaseUrl: string, caCert: string | undefined) => {
  if (!databaseUrl) return {}
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    throw new Error('DATABASE_URL is not a valid postgres:// URL.')
  }
  const overrides = OVERRIDE_PARAMS.filter((p) => url.searchParams.has(p))
  if (overrides.length) {
    throw new Error(`DATABASE_URL must not set ${overrides.join(', ')}: connection security is configured by the app.`)
  }
  if (LOCAL_HOSTS.has(url.hostname)) return {}
  if (!caCert) throw new Error('DATABASE_CA_CERT is required for a remote database (see docs/LAUNCH.md §1).')
  return { ssl: { ca: caCert, rejectUnauthorized: true } }
}
