import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import db from '../src/db/connect'

const api = '/api/v1/auth'
const creds = { email: 'ada@example.com', password: 'correct-horse-battery' }

const resetDb = () => db.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')

async function register(email = creds.email) {
  await request(app)
    .post(`${api}/register`)
    .send({ email, name: 'Test', password: creds.password })
}

async function login(email = creds.email, userAgent = 'device-1') {
  const res = await request(app)
    .post(`${api}/login`)
    .set('User-Agent', userAgent)
    .send({ email, password: creds.password })
  const cookie = (res.headers['set-cookie'] as unknown as string[]).map(
    (c) => c.split(';')[0],
  )
  return { accessToken: res.body.accessToken as string, cookie, res }
}

const bearer = (t: string) => ({ Authorization: `Bearer ${t}` })

beforeEach(resetDb)
afterAll(async () => {
  await resetDb()
  await db.$disconnect()
})

describe('login and /me', () => {
  it('logs in and returns the current user', async () => {
    await register()
    const { accessToken } = await login()
    const res = await request(app).get(`${api}/me`).set(bearer(accessToken))
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(creds.email)
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    await register()
    const wrong = await request(app)
      .post(`${api}/login`)
      .send({ email: creds.email, password: 'wrong-password-123' })
    const unknown = await request(app)
      .post(`${api}/login`)
      .send({ email: 'nobody@example.com', password: 'wrong-password-123' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.message).toBe(unknown.body.message)
  })
})

describe('refresh rotation', () => {
  it('rotates, and detects reuse of an old token by revoking the session', async () => {
    await register()
    const { cookie: tokenA } = await login()

    const first = await request(app)
      .post(`${api}/refresh`)
      .set('Cookie', tokenA)
    expect(first.status).toBe(200)
    const tokenB = (first.headers['set-cookie'] as unknown as string[]).map(
      (c) => c.split(';')[0],
    )

    const replay = await request(app)
      .post(`${api}/refresh`)
      .set('Cookie', tokenA)
    expect(replay.status).toBe(401)

    // Even the legitimate newest token is dead now.
    const afterReuse = await request(app)
      .post(`${api}/refresh`)
      .set('Cookie', tokenB)
    expect(afterReuse.status).toBe(401)

    const session = await db.session.findFirstOrThrow()
    expect(session.revokedAt).not.toBeNull()
  })

  it('lets exactly one of several simultaneous refreshes succeed', async () => {
    await register()
    const { cookie } = await login()

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post(`${api}/refresh`).set('Cookie', cookie),
      ),
    )
    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
  })
})

describe('logout', () => {
  it('kills the access token immediately', async () => {
    await register()
    const { accessToken, cookie } = await login()
    await request(app).post(`${api}/logout`).set('Cookie', cookie).expect(204)
    await request(app).get(`${api}/me`).set(bearer(accessToken)).expect(401)
  })
})

describe('session management', () => {
  it('lists devices, flags the current one, and revokes another', async () => {
    await register()
    const a = await login(creds.email, 'device-1')
    const b = await login(creds.email, 'device-2')

    const list = await request(app)
      .get(`${api}/sessions`)
      .set(bearer(a.accessToken))
    expect(list.status).toBe(200)
    expect(list.body.sessions).toHaveLength(2)
    expect(
      list.body.sessions.filter((s: { current: boolean }) => s.current),
    ).toHaveLength(1)
    expect(JSON.stringify(list.body)).not.toContain('refreshTokenHash')

    const other = list.body.sessions.find(
      (s: { userAgent: string }) => s.userAgent === 'device-2',
    )
    await request(app)
      .delete(`${api}/sessions/${other.id}`)
      .set(bearer(a.accessToken))
      .expect(204)
    await request(app).get(`${api}/me`).set(bearer(b.accessToken)).expect(401)
    await request(app).get(`${api}/me`).set(bearer(a.accessToken)).expect(200)
  })

  it("cannot revoke someone else's session", async () => {
    await register('ada@example.com')
    await register('eve@example.com')
    const ada = await login('ada@example.com')
    const eve = await login('eve@example.com')
    const adaSession = await db.session.findFirstOrThrow({
      where: { user: { email: 'ada@example.com' } },
    })

    await request(app)
      .delete(`${api}/sessions/${adaSession.id}`)
      .set(bearer(eve.accessToken))
      .expect(404)
    await request(app).get(`${api}/me`).set(bearer(ada.accessToken)).expect(200)
  })

  it('logout-all revokes every session', async () => {
    await register()
    const a = await login()
    const b = await login()
    await request(app)
      .post(`${api}/logout-all`)
      .set(bearer(a.accessToken))
      .expect(204)
    await request(app).get(`${api}/me`).set(bearer(a.accessToken)).expect(401)
    await request(app).get(`${api}/me`).set(bearer(b.accessToken)).expect(401)
  })
})

describe('role changes take effect immediately', () => {
  it('promotion and demotion apply without a token refresh', async () => {
    await register()
    const { accessToken } = await login()
    const users = () =>
      request(app).get('/api/v1/users').set(bearer(accessToken))

    await users().expect(403)
    await db.user.update({
      where: { email: creds.email },
      data: { role: 'ADMIN' },
    })
    await users().expect(200)
    await db.user.update({
      where: { email: creds.email },
      data: { role: 'BUYER' },
    })
    await users().expect(403)
  })
})
