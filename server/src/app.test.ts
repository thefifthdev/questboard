import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { prisma } from './db.js';

const app = createApp();

beforeEach(async () => {
  await prisma.questMeta.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('quest metadata API', () => {
  const valid = {
    title: 'Fix the claim button',
    description: 'The claim button does not refresh state after a successful claim.',
    acceptanceCriteria: 'State refreshes; tx link shown.',
    tags: 'frontend,good-first-issue',
    reward: '1000000',
    tokenSymbol: 'XLM',
    deadline: 0,
  };

  it('creates metadata and returns an id', async () => {
    const res = await request(app).post('/api/quests').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.questId).toBeNull();
    expect(res.body.title).toBe(valid.title);
  });

  it('rejects invalid bodies', async () => {
    const res = await request(app)
      .post('/api/quests')
      .send({ title: '', description: '', reward: 'abc' });
    expect(res.status).toBe(400);
  });

  it('lists metadata newest first', async () => {
    await request(app)
      .post('/api/quests')
      .send({ ...valid, title: 'First' });
    await request(app)
      .post('/api/quests')
      .send({ ...valid, title: 'Second' });
    const res = await request(app).get('/api/quests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Second');
  });

  it('links an on-chain quest id and fetches by it', async () => {
    const created = await request(app).post('/api/quests').send(valid);
    const id = created.body.id as string;

    const linked = await request(app).patch(`/api/quests/${id}`).send({ questId: 7 });
    expect(linked.status).toBe(200);
    expect(linked.body.questId).toBe(7);

    const byQuest = await request(app).get('/api/quests/by-quest/7');
    expect(byQuest.status).toBe(200);
    expect(byQuest.body.id).toBe(id);
  });

  it('records a deliverable url', async () => {
    const created = await request(app).post('/api/quests').send(valid);
    const id = created.body.id as string;
    const res = await request(app)
      .patch(`/api/quests/${id}`)
      .send({ deliverableUrl: 'https://github.com/thefifthdev/questboard/pull/1' });
    expect(res.status).toBe(200);
    expect(res.body.deliverableUrl).toContain('github.com');
  });

  it('404s for unknown record id', async () => {
    const res = await request(app).get('/api/quests/does-not-exist');
    expect(res.status).toBe(404);
  });
});
