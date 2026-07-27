import express from 'express';
import cors from 'cors';
import { initDB } from './db/schema.js';
import booksRouter from './routes/books.js';

const app = express();
const PORT = 3000;

// ── 中间件 ──
app.use(cors());
app.use(express.json());

// ── 路由挂载（功能模块实现后取消注释） ──
// import membersRouter    from './routes/members.js';
// import dashboardRouter  from './routes/dashboard.js';
// import borrowingsRouter from './routes/borrowings.js';
app.use('/api/books', booksRouter);
// app.use('/api/members',     membersRouter);
// app.use('/api/dashboard',   dashboardRouter);
// app.use('/api/borrowings',  borrowingsRouter);

// ── 健康检查 ──
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── 全局错误处理 ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── 启动 ──
initDB();
app.listen(PORT, () => console.log(`API server: http://localhost:${PORT}`));

export default app;
