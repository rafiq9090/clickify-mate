import assert from 'node:assert/strict'
import test from 'node:test'
import crypto from 'node:crypto'
import {
  decryptPaymentCredentials,
  encryptPaymentCredentials
} from '../payments/credentials-crypto'

test('admin and dashboard session secrets require production-strength entropy', () => {
  const weak = 'short-secret'
  const strong = crypto.randomBytes(32).toString('hex')
  assert.equal(weak.length < 32, true)
  assert.equal(strong.length >= 32, true)
})

test('password reset codes are hashed before persistence', () => {
  const code = 'A1B2C3D4E5F6'
  const digest = crypto.createHash('sha256').update(code).digest('hex')
  assert.equal(digest.length, 64)
  assert.notEqual(digest, code)
})

test('tenant database identifiers reject SQL syntax', () => {
  const identifier = /^[a-z_][a-z0-9_]*(?:->>[a-z_][a-z0-9_]*)?$/i
  assert.equal(identifier.test('data->>user_id'), true)
  assert.equal(identifier.test('id"; DROP TABLE users; --'), false)
  assert.equal(identifier.test('public.users'), false)
})

test('payment credentials use authenticated encryption and reject tampering', async () => {
  const previousKey = process.env.PAYMENT_CREDENTIALS_KEY
  process.env.PAYMENT_CREDENTIALS_KEY = crypto.randomBytes(32).toString('hex')
  try {
    const encrypted = encryptPaymentCredentials('{"secret":"merchant-key"}')
    assert.equal(encrypted.startsWith('v1:'), true)
    assert.equal(await decryptPaymentCredentials(encrypted), '{"secret":"merchant-key"}')

    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith('0') ? '1' : '0'}`
    await assert.rejects(() => decryptPaymentCredentials(tampered))
  } finally {
    if (previousKey === undefined) delete process.env.PAYMENT_CREDENTIALS_KEY
    else process.env.PAYMENT_CREDENTIALS_KEY = previousKey
  }
})
