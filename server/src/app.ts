import express, { type Express } from 'express';
import cors from 'cors';
import { questsRouter } from './routes/quests.js';

/** Build the Express app. Exported so tests can mount it without binding a port. */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/quests', questsRouter);

  // Fallback 404 for unknown routes.
  app.use((_req, res) => res.status(404).json({ error: 'not found' }));

  return app;
}
