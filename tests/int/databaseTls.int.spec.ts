import { describe, expect, it } from 'vitest'

import { databaseTls } from '@/lib/databaseTls'

const CA = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----'

describe('database TLS', () => {
  it('local databases connect without TLS', () => {
    expect(databaseTls('postgresql://postgres:postgres@127.0.0.1:5432/clarity60', undefined)).toEqual({})
    expect(databaseTls('postgresql://postgres:postgres@localhost/clarity60', undefined)).toEqual({})
  })

  it('remote databases require the CA and verify the certificate', () => {
    const url = 'postgresql://postgres.ref:pw@aws-0-us-west-2.pooler.supabase.com:5432/postgres'
    expect(() => databaseTls(url, undefined)).toThrow(/DATABASE_CA_CERT is required/)
    expect(databaseTls(url, CA)).toEqual({ ssl: { ca: CA, rejectUnauthorized: true } })
  })

  it('rejects URL parameters that would override the host or TLS', () => {
    expect(() => databaseTls('postgres://u:p@localhost/db?host=remote.example', undefined)).toThrow(/must not set host/)
    expect(() => databaseTls('postgres://u:p@db.example.com/db?sslmode=disable', CA)).toThrow(/must not set sslmode/)
    expect(() => databaseTls('postgres://u:p@db.example.com/db?ssl=false', CA)).toThrow(/must not set ssl/)
  })
})
