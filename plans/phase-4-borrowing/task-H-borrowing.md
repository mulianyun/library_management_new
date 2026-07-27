# 任务 H — 借阅模块（后端 API + 前端页面）

| 属性 | 值 |
|---|---|
| 阶段 | phase-4-borrowing |
| 上游依赖 | B（db + types）, C（Express）, D（React 骨架） |
| 可并行 | — |
| 下游被依赖 | — |

> 注：借阅模块只依赖 B 的数据库表结构和 C/D 的骨架。不需要等 E/F 的代码完成——表由 B 创建，只是测试时需要有图书和会员数据。

## 产出文件

```
server/src/routes/borrowings.ts
client/src/pages/borrowings/BorrowingListPage.tsx
client/src/pages/borrowings/BorrowingNewPage.tsx
client/src/pages/borrowings/BorrowingHistoryPage.tsx
```

---

## 1. `server/src/routes/borrowings.ts`

```ts
import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { BorrowingRecord, BorrowingRecordView, Book, Member } from '../types/models.js';

const router = Router();

// GET /api/borrowings — 当前借阅列表
router.get('/', (_req: Request, res: Response) => {
  const records = db.prepare(`
    SELECT br.*, b.title AS book_title, m.name AS member_name
    FROM borrowing_records br
    JOIN books b ON br.book_id = b.id
    JOIN members m ON br.member_id = m.id
    WHERE br.status = 'borrowed'
    ORDER BY br.due_date ASC
  `).all() as BorrowingRecordView[];
  res.json({ data: records });
});

// GET /api/borrowings/history — 借阅历史
router.get('/history', (req: Request, res: Response) => {
  const { member_id, book_id } = req.query as { member_id?: string; book_id?: string };
  let sql = `
    SELECT br.*, b.title AS book_title, m.name AS member_name
    FROM borrowing_records br
    JOIN books b ON br.book_id = b.id
    JOIN members m ON br.member_id = m.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (member_id) { sql += ' AND br.member_id = ?'; params.push(member_id); }
  if (book_id)   { sql += ' AND br.book_id = ?';   params.push(book_id); }
  sql += ' ORDER BY br.borrow_date DESC';
  const records = db.prepare(sql).all(...params) as BorrowingRecordView[];
  res.json({ data: records });
});

// POST /api/borrowings — 借书
router.post('/', (req: Request, res: Response) => {
  const { member_id, book_id, due_date } = req.body as { member_id: number; book_id: number; due_date: string };
  if (!member_id || !book_id || !due_date) return res.status(400).json({ error: '缺少必填参数' });
  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(member_id);
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const book = db.prepare('SELECT id, available_copies FROM books WHERE id = ?').get(book_id) as Pick<Book, 'id' | 'available_copies'> | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  if (book.available_copies < 1) return res.status(409).json({ error: '该图书已全部借出' });
  try {
    db.transaction(() => {
      db.prepare('INSERT INTO borrowing_records (book_id, member_id, due_date) VALUES (?, ?, ?)').run(book.id, member_id, due_date);
      db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(book.id);
    })();
    res.status(201).json({ data: { ok: true } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/borrowings/:id/return — 还书
router.post('/:id/return', (req: Request, res: Response) => {
  const record = db.prepare('SELECT * FROM borrowing_records WHERE id = ?').get(req.params.id) as BorrowingRecord | undefined;
  if (!record) return res.status(404).json({ error: '借阅记录不存在' });
  if (record.status === 'returned') return res.status(409).json({ error: '该记录已归还' });
  db.transaction(() => {
    db.prepare("UPDATE borrowing_records SET return_date = datetime('now','localtime'), status = 'returned' WHERE id = ?").run(record.id);
    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(record.book_id);
  })();
  res.json({ data: { ok: true } });
});

export default router;
```

---

## 2. `client/src/pages/borrowings/BorrowingListPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { BorrowingRecordView } from '../../types/models';

export default function BorrowingListPage() {
  const [borrowings, setBorrowings] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchList = () => {
    setLoading(true);
    api.get<BorrowingRecordView[]>('/borrowings')
      .then(setBorrowings).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(fetchList, []);

  const handleReturn = async (id: number) => {
    if (!confirm('确认归还？')) return;
    try { await api.post(`/borrowings/${id}/return`, {}); fetchList(); }
    catch (e) { alert((e as ApiError).message); }
  };

  if (loading) return <p>加载中...</p>;

  const now = new Date().toISOString();

  return (
    <div>
      <div className="toolbar">
        <h2>当前借阅</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/borrowings/new" className="btn btn-primary">+ 借阅图书</Link>
          <Link to="/borrowings/history" className="btn btn-secondary">借阅历史</Link>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table>
        <thead><tr><th>书名</th><th>借阅人</th><th>借出日期</th><th>应还日期</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          {borrowings.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#999'}}>暂无借出记录</td></tr>}
          {borrowings.map(b => {
            const isOverdue = b.status === 'borrowed' && b.due_date < now;
            return (
              <tr key={b.id}>
                <td><Link to={`/books/${b.book_id}`}>{b.book_title}</Link></td>
                <td><Link to={`/members/${b.member_id}`}>{b.member_name}</Link></td>
                <td>{b.borrow_date}</td>
                <td style={isOverdue ? { color: 'red', fontWeight: 600 } : {}}>{b.due_date}</td>
                <td>{isOverdue ? <span className="badge-overdue">逾期</span> : <span className="badge-returned">借出中</span>}</td>
                <td><button className="btn btn-sm btn-primary" onClick={() => handleReturn(b.id)}>归还</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. `client/src/pages/borrowings/BorrowingNewPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Member, Book } from '../../types/models';

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export default function BorrowingNewPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Pick<Member, 'id' | 'name'>[]>([]);
  const [books, setBooks] = useState<Pick<Book, 'id' | 'title' | 'available_copies'>[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ member_id: '', book_id: '', due_date: defaultDueDate() });

  useEffect(() => {
    Promise.all([
      api.get<Pick<Member, 'id' | 'name'>[]>('/members'),
      api.get<Pick<Book, 'id' | 'title' | 'available_copies'>[]>('/books'),
    ]).then(([m, b]) => {
      setMembers(m);
      setBooks((b as Book[]).filter(bk => bk.available_copies > 0));
    }).catch(e => setError(e.message));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/borrowings', { member_id: Number(form.member_id), book_id: Number(form.book_id), due_date: form.due_date });
      navigate('/borrowings');
    } catch (e) { setError((e as ApiError).message); }
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2>借阅图书</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>会员 *</label>
          <select value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} required>
            <option value="">请选择会员</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>图书 *</label>
          <select value={form.book_id} onChange={e => setForm({...form, book_id: e.target.value})} required>
            <option value="">请选择图书</option>
            {books.map(b => <option key={b.id} value={b.id}>{b.title} (可借:{b.available_copies})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>应还日期 *</label>
          <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} required />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">确认借出</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/borrowings')}>取消</button>
        </div>
      </form>
    </div>
  );
}
```

---

## 4. `client/src/pages/borrowings/BorrowingHistoryPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { BorrowingRecordView } from '../../types/models';

export default function BorrowingHistoryPage() {
  const [records, setRecords] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<BorrowingRecordView[]>('/borrowings/history')
      .then(setRecords).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <div className="toolbar">
        <h2>借阅历史</h2>
        <Link to="/borrowings" className="btn btn-secondary">← 当前借阅</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table>
        <thead><tr><th>书名</th><th>借阅人</th><th>借出日期</th><th>应还日期</th><th>归还日期</th><th>状态</th></tr></thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#999'}}>暂无记录</td></tr>}
          {records.map(r => (
            <tr key={r.id}>
              <td><Link to={`/books/${r.book_id}`}>{r.book_title}</Link></td>
              <td><Link to={`/members/${r.member_id}`}>{r.member_name}</Link></td>
              <td>{r.borrow_date}</td>
              <td>{r.due_date}</td>
              <td>{r.return_date || '-'}</td>
              <td>{r.status === 'borrowed' ? <span className="badge-overdue">借出中</span> : <span className="badge-returned">已归还</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 在 App.tsx 中接入路由

```tsx
import BorrowingListPage    from './pages/borrowings/BorrowingListPage';
import BorrowingNewPage     from './pages/borrowings/BorrowingNewPage';
import BorrowingHistoryPage from './pages/borrowings/BorrowingHistoryPage';

// 替换占位的 "/borrowings" 路由：
<Route path="/borrowings"          element={<BorrowingListPage />} />
<Route path="/borrowings/new"      element={<BorrowingNewPage />} />
<Route path="/borrowings/history"  element={<BorrowingHistoryPage />} />
```

## 在 server/index.ts 中接入路由

```ts
import borrowingsRouter from './routes/borrowings.js';
app.use('/api/borrowings', borrowingsRouter);
```

## 完成标准

- [ ] 借书 API 在事务中扣减 `available_copies`
- [ ] 还书 API 在事务中恢复 `available_copies`
- [ ] 前端可创建借阅（下拉选会员和可借图书）
- [ ] 前端可归还（点击归还按钮）
- [ ] 借阅历史页面展示全部记录
- [ ] 逾期记录红色标记
