import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/server'

describe('POST /api/v1/auth/register validation', () => {
  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', name: 'Ada', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.errors[0].path).toBe('password')
  })

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'nope', name: 'Ada', password: 'long-enough-password' })
    expect(res.status).toBe(400)
    expect(res.body.errors[0].path).toBe('email')
  })
})

describe('POST /api/v1/auth/login validation', () => {
  it('rejects an empty body', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({})
    expect(res.status).toBe(400)
  })
})
