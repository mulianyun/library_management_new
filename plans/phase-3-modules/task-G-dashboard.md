# 任务 G — 仪表盘（后端 API + 前端首页）

| 属性 | 值 |
|---|---|
| 阶段 | phase-3-modules |
| 上游依赖 | B（db + types）, C（Express）, D（React 骨架 + StatCard） |
| 可并行 | E, F |
| 下游被依赖 | — |

## 产出文件

```
server/src/routes/dashboard.ts
client/src/components/StatCard.tsx
client/src/pages/HomePage.tsx
```

---

## 1. `server/src/routes/dashboard.ts`

```ts
import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { DashboardStats } from '../types/models.js';

const router = Router();

router.get('/stats', (_req: Request, res: Response) => {
  const stats: DashboardStats = {
    totalBooks:    (db.prepare('SELECT COUNT(*) AS c FROM books').get() as { c: number }).c,
    totalMembers:  (db.prepare('SELECT COUNT(*) AS c FROM members').get() as { c: number }).c,
    activeBorrows: (db.prepare("SELECT COUNT(*) AS c FROM borrowing_records WHERE status = 'borrowed'").get() as { c: number }).c,
    overdue:       (db.prepare("SELECT COUNT(*) AS c FROM borrowing_records WHERE status = 'borrowed' AND due_date < datetime('now','localtime')").get() as { c: number }).c,
  };
  res.json({ data: stats });
});

export default router;
```

---

## 2. `client/src/components/StatCard.tsx`

```tsx
interface StatCardProps {
  value: number;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="card stat-card">
      <h2>{value}</h2>
      <p style={{ color: '#888', marginTop: 4 }}>{label}</p>
    </div>
  );
}
```

---

## 3. `client/src/pages/HomePage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardStats } from '../types/models';
import StatCard from '../components/StatCard';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(setStats).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>加载中...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <div className="stats-grid">
        <StatCard value={stats.totalBooks} label="馆藏图书" />
        <StatCard value={stats.totalMembers} label="注册会员" />
        <StatCard value={stats.activeBorrows} label="借出中" />
        <StatCard value={stats.overdue} label="逾期未还" />
      </div>

      <div className="quick-actions">
        <Link to="/books/new">+ 添加图书</Link>
        <Link to="/members/new">+ 添加会员</Link>
        <Link to="/borrowings/new">+ 借阅图书</Link>
      </div>
    </div>
  );
}
```

---

## 在 App.tsx 中接入路由

```tsx
import HomePage from './pages/HomePage';

// 替换占位的 "/" 路由：
<Route path="/" element={<HomePage />} />
```

## 在 server/index.ts 中接入路由

```ts
import dashboardRouter from './routes/dashboard.js';
app.use('/api/dashboard', dashboardRouter);
```

## 完成标准

- [ ] `curl http://localhost:3000/api/dashboard/stats` 返回 4 项统计数据
- [ ] 首页 `/` 显示 4 张统计卡片
- [ ] 快捷操作按钮可跳转到对应页面
