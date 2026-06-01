import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);

createApp().listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`QuestBoard metadata API listening on http://localhost:${port}`);
});
