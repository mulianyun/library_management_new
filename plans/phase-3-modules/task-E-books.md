# 任务 E — 图书模块（后端 API + 前端页面）

| 属性 | 值 |
|---|---|
| 阶段 | phase-3-modules |
| 上游依赖 | B（db + types）, C（Express 实例 + `/api` 前缀约定）, D（React 路由 + api client + 组件）|
| 可并行 | F, G |
| 下游被依赖 | H（借阅模块需要图书列表接口） |

## 产出文件

```
server/src/routes/books.ts           # 后端 API
client/src/pages/books/BookListPage.tsx
client/src/pages/books/BookFormPage.tsx
client/src/pages/books/BookDetailPage.tsx
```

---

## 1. `server/src/routes/books.ts`

```ts
import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { Book, BookInput, BorrowingRecordView } from '../types/models.js';

const router = Router();

// GET /api/books — 列表
router.get('/', (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  let books: Book[];
  if (search) {
    const q = `%${search}%`;
    books = db.prepare(`SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? ORDER BY created_at DESC`).all(q, q, q) as Book[];
  } else {
    books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all() as Book[];
  }
  res.json({ data: books });
});

// GET /api/books/:id — 详情 + 借阅记录
router.get('/:id', (req: Request, res: Response) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  const records = db.prepare(`
    SELECT br.*, b.title AS book_title, m.name AS member_name
    FROM borrowing_records br
    JOIN books b ON br.book_id = b.id
    JOIN members m ON br.member_id = m.id
    WHERE br.book_id = ? ORDER BY br.borrow_date DESC
  `).all(book.id) as BorrowingRecordView[];
  res.json({ data: { book, records } });
});

// POST /api/books — 创建
router.post('/', (req: Request, res: Response) => {
  const { isbn, title, author, publisher, published_year, category, total_copies } = req.body as BookInput;
  if (!isbn || !title || !author) return res.status(400).json({ error: 'ISBN、书名、作者为必填项' });
  const copies = total_copies || 1;
  const existing = db.prepare('SELECT id FROM books WHERE isbn = ?').get(isbn);
  if (existing) return res.status(409).json({ error: 'ISBN 已存在' });
  db.prepare(`INSERT INTO books (isbn, title, author, publisher, published_year, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(isbn, title, author, publisher || null, published_year || null, category || null, copies, copies);
  res.status(201).json({ data: { ok: true } });
});

// PUT /api/books/:id — 更新
router.put('/:id', (req: Request, res: Response) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  const { isbn, title, author, publisher, published_year, category, total_copies } = req.body as BookInput;
  if (!isbn || !title || !author) return res.status(400).json({ error: 'ISBN、书名、作者为必填项' });
  const dup = db.prepare('SELECT id FROM books WHERE isbn = ? AND id != ?').get(isbn, book.id);
  if (dup) return res.status(409).json({ error: 'ISBN 已存在' });
  const copies = total_copies || 1;
  const borrowed = (db.prepare(`SELECT COUNT(*) AS c FROM borrowing_records WHERE book_id = ? AND status = 'borrowed'`).get(book.id) as { c: number }).c;
  const newAvailable = Math.max(0, copies - borrowed);
  db.prepare(`UPDATE books SET isbn=?, title=?, author=?, publisher=?, published_year=?, category=?, total_copies=?, available_copies=?, updated_at=datetime('now','localtime') WHERE id=?`)
    .run(isbn, title, author, publisher || null, published_year || null, category || null, copies, newAvailable, book.id);
  res.json({ data: { ok: true } });
});

// DELETE /api/books/:id — 删除
router.delete('/:id', (req: Request, res: Response) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  const active = (db.prepare(`SELECT COUNT(*) AS c FROM borrowing_records WHERE book_id = ? AND status = 'borrowed'`).get(book.id) as { c: number }).c;
  if (active > 0) return res.status(409).json({ error: '该图书有未归还的借阅记录，无法删除' });
  db.prepare('DELETE FROM borrowing_records WHERE book_id = ?').run(book.id);
  db.prepare('DELETE FROM books WHERE id = ?').run(book.id);
  res.json({ data: { ok: true } });
});

export default router;
```

---

## 2. `client/src/pages/books/BookListPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Book } from '../../types/models';

export default function BookListPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooks = () => {
    setLoading(true);
    api.get<Book[]>(`/books${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(setBooks).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(fetchBooks, [search]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定删除《${title}》？`)) return;
    try { await api.delete(`/books/${id}`); fetchBooks(); }
    catch (e) { alert((e as ApiError).message); }
  };

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <div className="toolbar">
        <input type="text" placeholder="搜索书名/作者/ISBN..."
          defaultValue={search}
          onKeyDown={e => { if (e.key === 'Enter') window.location.search = `?search=${(e.target as HTMLInputElement).value}`; }} />
        <Link to="/books/new" className="btn btn-primary">+ 添加新书</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table>
        <thead><tr><th>ISBN</th><th>书名</th><th>作者</th><th>分类</th><th>可借/馆藏</th><th>操作</th></tr></thead>
        <tbody>
          {books.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#999'}}>暂无图书</td></tr>}
          {books.map(b => (
            <tr key={b.id}>
              <td>{b.isbn}</td>
              <td><Link to={`/books/${b.id}`}>{b.title}</Link></td>
              <td>{b.author}</td>
              <td>{b.category || '-'}</td>
              <td>{b.available_copies}/{b.total_copies}</td>
              <td style={{display:'flex', gap:8}}>
                <Link to={`/books/${b.id}`} className="btn btn-sm btn-secondary">查看</Link>
                <Link to={`/books/${b.id}/edit`} className="btn btn-sm btn-secondary">编辑</Link>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id, b.title)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. `client/src/pages/books/BookFormPage.tsx`

新建和编辑复用同一个组件，通过 URL 参数 `:id` 区分。

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Book } from '../../types/models';

export default function BookFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ isbn: '', title: '', author: '', publisher: '', published_year: '', category: '', total_copies: '1' });

  useEffect(() => {
    if (!isEdit) return;
    api.get<{ book: Book; records: unknown[] }>(`/books/${id}`).then(res => {
      const b = res.book;
      setForm({ isbn: b.isbn, title: b.title, author: b.author, publisher: b.publisher || '', published_year: b.published_year?.toString() || '', category: b.category || '', total_copies: b.total_copies.toString() });
    }).catch(e => setError(e.message));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = { ...form, total_copies: parseInt(form.total_copies, 10) || 1, published_year: form.published_year ? parseInt(form.published_year, 10) : undefined };
      if (isEdit) await api.put(`/books/${id}`, body);
      else await api.post('/books', body);
      navigate('/books');
    } catch (e) { setError((e as ApiError).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2>{isEdit ? '编辑图书' : '添加图书'}</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>ISBN *</label><input value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} required /></div>
        <div className="form-group"><label>书名 *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
        <div className="form-group"><label>作者 *</label><input value={form.author} onChange={e => setForm({...form, author: e.target.value})} required /></div>
        <div className="form-group"><label>出版社</label><input value={form.publisher} onChange={e => setForm({...form, publisher: e.target.value})} /></div>
        <div className="form-group"><label>出版年份</label><input type="number" value={form.published_year} onChange={e => setForm({...form, published_year: e.target.value})} /></div>
        <div className="form-group"><label>分类</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
        <div className="form-group"><label>馆藏数量 *</label><input type="number" min={1} value={form.total_copies} onChange={e => setForm({...form, total_copies: e.target.value})} required /></div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/books')}>取消</button>
        </div>
      </form>
    </div>
  );
}
```

---

## 4. `client/src/pages/books/BookDetailPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Book, BorrowingRecordView } from '../../types/models';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [records, setRecords] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ book: Book; records: BorrowingRecordView[] }>(`/books/${id}`)
      .then(res => { setBook(res.book); setRecords(res.records); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>加载中...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!book) return <p>图书不存在</p>;

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{book.title}</h2>
          <Link to={`/books/${book.id}/edit`} className="btn btn-primary">编辑</Link>
        </div>
        <p><strong>ISBN:</strong> {book.isbn}</p>
        <p><strong>作者:</strong> {book.author}</p>
        <p><strong>出版社:</strong> {book.publisher || '-'}</p>
        <p><strong>出版年份:</strong> {book.published_year || '-'}</p>
        <p><strong>分类:</strong> {book.category || '-'}</p>
        <p><strong>可借/馆藏:</strong> {book.available_copies}/{book.total_copies}</p>
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 12 }}>借阅记录</h3>
      <table>
        <thead><tr><th>借阅人</th><th>借出日期</th><th>应还日期</th><th>归还日期</th><th>状态</th></tr></thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#999'}}>暂无借阅记录</td></tr>}
          {records.map(r => (
            <tr key={r.id}>
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

在 `client/src/App.tsx` 中取消注释并添加：

```tsx
import BookListPage   from './pages/books/BookListPage';
import BookFormPage   from './pages/books/BookFormPage';
import BookDetailPage from './pages/books/BookDetailPage';

// 在 <Routes> 中添加：
<Route path="/books"          element={<BookListPage />} />
<Route path="/books/new"      element={<BookFormPage />} />
<Route path="/books/:id"       element={<BookDetailPage />} />
<Route path="/books/:id/edit" element={<BookFormPage />} />
```

## 在 server/index.ts 中接入路由

```ts
import booksRouter from './routes/books.js';
app.use('/api/books', booksRouter);
```

## 完成标准

- [ ] `curl http://localhost:3000/api/books` 返回 `{"data":[]}`
- [ ] `curl -X POST -H 'Content-Type: application/json' -d '{"isbn":"978-7-111","title":"测试","author":"测试","total_copies":2}' http://localhost:3000/api/books` 创建成功
- [ ] 前端 `/books` 页面可看到图书列表
- [ ] 前端可新建、编辑、查看详情、删除图书
