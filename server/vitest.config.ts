import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests run against a throwaway SQLite file, provisioned in global setup.
    env: { DATABASE_URL: 'file:./prisma/test.db' },
    globalSetup: './src/test/global-setup.ts',
    pool: 'forks',
    fileParallelism: false,
  },
});
