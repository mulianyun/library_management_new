# 任务 C — Express API 骨架

| 属性 | 值 |
|---|---|
| 阶段 | phase-2-foundation |
| 上游依赖 | A（express 已安装）, B（initDB, db） |
| 可并行 | D（React 骨架） |
| 下游被依赖 | E, F, G, H |

## 产出文件

```
server/index.ts
```

## `server/index.ts`

```ts
import express from 'express';
import cors from 'cors';
import { initDB } from './db/schema.js';

// ── 下游任务完成后取消各自的注释 ──
// import booksRouter      from './routes/books.js';
// import membersRouter    from './routes/members.js';
// import dashboardRouter  from './routes/dashboard.js';
// import borrowingsRouter from './routes/borrowings.js';

const app = express();
const PORT = 3000;

// ── 中间件 ──
app.use(cors());
app.use(express.json());

// ── 路由挂载 ──
// app.use('/api/books',       booksRouter);
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
```

## 接口契约

### 通用约定

**API 响应格式**（所有下游路由必须遵守）:
```ts
// 成功: { data: T }
// 失败: { error: string }
```

**HTTP 状态码约定**:
- `200` 成功（GET/PUT）
- `201` 创建成功（POST）
- `400` 请求参数错误
- `404` 资源不存在
- `409` 业务冲突（如删除有未归还记录的图书）
- `500` 服务器内部错误

### 路由挂载约定

| 前缀 | 变量名 | 文件 | 任务 |
|---|---|---|---|
| `/api/books` | `booksRouter` | `./routes/books.js` | E |
| `/api/members` | `membersRouter` | `./routes/members.js` | F |
| `/api/dashboard` | `dashboardRouter` | `./routes/dashboard.js` | G |
| `/api/borrowings` | `borrowingsRouter` | `./routes/borrowings.js` | H |

### 导出

`export default app` — 供测试使用

## 完成标准

- [ ] `npm start` 启动，`curl http://localhost:3000/api/health` 返回 `{"ok":true}`
- [ ] `curl http://localhost:3000/api/nonexist` 返回 `{"error":"Not found"}` 状态码 404
- [ ] 类型检查通过
