import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// Provision a throwaway test database before the suite runs. We remove any
// previous file (a plain fs delete, not a destructive DB migration) and then
// sync the schema with a non-destructive `db push`.
export default function setup() {
  const DATABASE_URL = 'file:./prisma/test.db';
  rmSync('./prisma/test.db', { force: true });
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL },
  });
}
