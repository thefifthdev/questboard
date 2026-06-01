import { z } from 'zod';

/** Body for creating a quest's off-chain metadata (before the on-chain post). */
export const createQuestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  acceptanceCriteria: z.string().max(5000).default(''),
  tags: z.string().max(300).default(''),
  // Reward in the token's smallest unit, as a string to stay i128-safe.
  reward: z.string().regex(/^\d+$/, 'reward must be a non-negative integer string'),
  tokenSymbol: z.string().max(12).default('XLM'),
  deadline: z.number().int().nonnegative().default(0),
});

/** Body for linking the on-chain quest id and/or recording a deliverable. */
export const linkQuestSchema = z
  .object({
    questId: z.number().int().nonnegative().optional(),
    deliverableUrl: z.string().url().max(512).optional(),
  })
  .refine((d) => d.questId !== undefined || d.deliverableUrl !== undefined, {
    message: 'provide questId and/or deliverableUrl',
  });

export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type LinkQuestInput = z.infer<typeof linkQuestSchema>;
