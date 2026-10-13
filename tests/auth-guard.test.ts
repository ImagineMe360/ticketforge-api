import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/server'

describe('auth guards', () => {
  it('GET /auth/me without a token is 401', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /auth/me with a garbage token is 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.jwt')
    expect(res.status).toBe(401)
  })

  it('GET /users without a token is 401', async () => {
    const res = await request(app).get('/api/v1/users')
    expect(res.status).toBe(401)
  })

  it('POST /auth/refresh without the cookie is 401', async () => {
    const res = await request(app).post('/api/v1/auth/refresh')
    expect(res.status).toBe(401)
  })
})
