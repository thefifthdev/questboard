import { Router, type Router as RouterType } from 'express';
import { prisma } from '../db.js';
import { createQuestSchema, linkQuestSchema } from '../schemas.js';

export const questsRouter: RouterType = Router();

// Create off-chain metadata for a new quest. The returned `id` is what the
// client embeds in the contract's `metadata` pointer when posting on-chain.
questsRouter.post('/', async (req, res) => {
  const parsed = createQuestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const quest = await prisma.questMeta.create({ data: parsed.data });
  return res.status(201).json(quest);
});

// List all quest metadata, newest first.
questsRouter.get('/', async (_req, res) => {
  const quests = await prisma.questMeta.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(quests);
});

// Fetch metadata by on-chain quest id (declared before "/:id" by specificity).
questsRouter.get('/by-quest/:questId', async (req, res) => {
  const questId = Number(req.params.questId);
  if (!Number.isInteger(questId) || questId < 0) {
    return res.status(400).json({ error: 'invalid questId' });
  }
  const quest = await prisma.questMeta.findUnique({ where: { questId } });
  if (!quest) return res.status(404).json({ error: 'not found' });
  return res.json(quest);
});

// Fetch metadata by record id (the on-chain metadata pointer).
questsRouter.get('/:id', async (req, res) => {
  const quest = await prisma.questMeta.findUnique({ where: { id: req.params.id } });
  if (!quest) return res.status(404).json({ error: 'not found' });
  return res.json(quest);
});

// Link the confirmed on-chain quest id and/or record a deliverable url.
questsRouter.patch('/:id', async (req, res) => {
  const parsed = linkQuestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const quest = await prisma.questMeta.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    return res.json(quest);
  } catch {
    return res.status(404).json({ error: 'not found' });
  }
});
