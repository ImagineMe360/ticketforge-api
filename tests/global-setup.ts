import { execSync } from 'node:child_process'
import { TEST_DATABASE_URL } from './test-env'

export default function setup() {
  // migrate deploy applies existing migrations only. It never creates new ones.
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  })
}
