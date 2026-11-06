import { execSync } from 'node:child_process'
import { TEST_DATABASE_URL, TEST_REDIS_URL } from './test-env'
import Redis from 'ioredis'

export default async function setup() {
  // migrate deploy applies existing migrations only. It never creates new ones.
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  })

  const redis = new Redis(TEST_REDIS_URL)
  await redis.flushdb()
  await redis.quit()
}
