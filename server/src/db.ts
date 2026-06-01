import { PrismaClient } from '@prisma/client';

/** Shared Prisma client. Reused across requests and tests. */
export const prisma = new PrismaClient();
