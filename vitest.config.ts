import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL, TEST_JWT_SECRET } from './tests/test-env'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    globalSetup: ['./tests/global-setup.ts'],
    fileParallelism: false, // test files share one database
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: TEST_JWT_SECRET,
    },
  },
})
