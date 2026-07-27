# 任务 F — 会员模块（后端 API + 前端页面）

| 属性 | 值 |
|---|---|
| 阶段 | phase-3-modules |
| 上游依赖 | B（db + types）, C（Express）, D（React 骨架） |
| 可并行 | E, G |
| 下游被依赖 | H（借阅模块需要会员列表接口） |

## 产出文件

```
server/src/routes/members.ts
client/src/pages/members/MemberListPage.tsx
client/src/pages/members/MemberFormPage.tsx
client/src/pages/members/MemberDetailPage.tsx
```

---

## 1. `server/src/routes/members.ts`

```ts
import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { Member, MemberInput, BorrowingRecordView } from '../types/models.js';

const router = Router();

// GET /api/members — 列表
router.get('/', (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  let members: Member[];
  if (search) {
    members = db.prepare('SELECT * FROM members WHERE name LIKE ? ORDER BY created_at DESC').all(`%${search}%`) as Member[];
  } else {
    members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all() as Member[];
  }
  res.json({ data: members });
});

// GET /api/members/:id — 详情 + 借阅记录
router.get('/:id', (req: Request, res: Response) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id) as Member | undefined;
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const records = db.prepare(`
    SELECT br.*, b.title AS book_title, m2.name AS member_name
    FROM borrowing_records br
    JOIN books b ON br.book_id = b.id
    JOIN members m2 ON br.member_id = m2.id
    WHERE br.member_id = ? ORDER BY br.borrow_date DESC
  `).all(member.id) as BorrowingRecordView[];
  res.json({ data: { member, records } });
});

// POST /api/members — 创建
router.post('/', (req: Request, res: Response) => {
  const { name, email, phone, address } = req.body as MemberInput;
  if (!name || !name.trim()) return res.status(400).json({ error: '姓名为必填项' });
  const result = db.prepare('INSERT INTO members (name, email, phone, address) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email || null, phone || null, address || null);
  res.status(201).json({ data: { id: result.lastInsertRowid, ok: true } });
});

// PUT /api/members/:id — 更新
router.put('/:id', (req: Request, res: Response) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id) as Member | undefined;
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const { name, email, phone, address } = req.body as MemberInput;
  if (!name || !name.trim()) return res.status(400).json({ error: '姓名为必填项' });
  db.prepare(`UPDATE members SET name=?, email=?, phone=?, address=?, updated_at=datetime('now','localtime') WHERE id=?`)
    .run(name.trim(), email || null, phone || null, address || null, member.id);
  res.json({ data: { ok: true } });
});

// DELETE /api/members/:id — 删除
router.delete('/:id', (req: Request, res: Response) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id) as Member | undefined;
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const active = (db.prepare(`SELECT COUNT(*) AS c FROM borrowing_records WHERE member_id = ? AND status = 'borrowed'`).get(member.id) as { c: number }).c;
  if (active > 0) return res.status(409).json({ error: '该会员有未归还的图书，无法删除' });
  db.prepare('DELETE FROM borrowing_records WHERE member_id = ?').run(member.id);
  db.prepare('DELETE FROM members WHERE id = ?').run(member.id);
  res.json({ data: { ok: true } });
});

export default router;
```

---

## 2. `client/src/pages/members/MemberListPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Member } from '../../types/models';

export default function MemberListPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = () => {
    setLoading(true);
    api.get<Member[]>(`/members${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(setMembers).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(fetchMembers, [search]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除会员"${name}"？`)) return;
    try { await api.delete(`/members/${id}`); fetchMembers(); }
    catch (e) { alert((e as ApiError).message); }
  };

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <div className="toolbar">
        <input type="text" placeholder="搜索姓名..."
          defaultValue={search}
          onKeyDown={e => { if (e.key === 'Enter') window.location.search = `?search=${(e.target as HTMLInputElement).value}`; }} />
        <Link to="/members/new" className="btn btn-primary">+ 添加会员</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table>
        <thead><tr><th>编号</th><th>姓名</th><th>邮箱</th><th>电话</th><th>入会日期</th><th>操作</th></tr></thead>
        <tbody>
          {members.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#999'}}>暂无会员</td></tr>}
          {members.map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td><Link to={`/members/${m.id}`}>{m.name}</Link></td>
              <td>{m.email || '-'}</td>
              <td>{m.phone || '-'}</td>
              <td>{m.membership_date}</td>
              <td style={{display:'flex', gap:8}}>
                <Link to={`/members/${m.id}`} className="btn btn-sm btn-secondary">查看</Link>
                <Link to={`/members/${m.id}/edit`} className="btn btn-sm btn-secondary">编辑</Link>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id, m.name)}>删除</button>
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

## 3. `client/src/pages/members/MemberFormPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Member } from '../../types/models';

export default function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    if (!isEdit) return;
    api.get<{ member: Member; records: unknown[] }>(`/members/${id}`).then(res => {
      const m = res.member;
      setForm({ name: m.name, email: m.email || '', phone: m.phone || '', address: m.address || '' });
    }).catch(e => setError(e.message));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) await api.put(`/members/${id}`, form);
      else await api.post('/members', form);
      navigate('/members');
    } catch (e) { setError((e as ApiError).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2>{isEdit ? '编辑会员' : '添加会员'}</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>姓名 *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><label>邮箱</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
        <div className="form-group"><label>电话</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
        <div className="form-group"><label>地址</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/members')}>取消</button>
        </div>
      </form>
    </div>
  );
}
```

---

## 4. `client/src/pages/members/MemberDetailPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, BorrowingRecordView } from '../../types/models';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ member: Member; records: BorrowingRecordView[] }>(`/members/${id}`)
      .then(res => { setMember(res.member); setRecords(res.records); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>加载中...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!member) return <p>会员不存在</p>;

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{member.name}</h2>
          <Link to={`/members/${member.id}/edit`} className="btn btn-primary">编辑</Link>
        </div>
        <p><strong>编号:</strong> {member.id}</p>
        <p><strong>邮箱:</strong> {member.email || '-'}</p>
        <p><strong>电话:</strong> {member.phone || '-'}</p>
        <p><strong>地址:</strong> {member.address || '-'}</p>
        <p><strong>入会日期:</strong> {member.membership_date}</p>
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 12 }}>借阅记录</h3>
      <table>
        <thead><tr><th>书名</th><th>借出日期</th><th>应还日期</th><th>归还日期</th><th>状态</th></tr></thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#999'}}>暂无借阅记录</td></tr>}
          {records.map(r => (
            <tr key={r.id}>
              <td><Link to={`/books/${r.book_id}`}>{r.book_title}</Link></td>
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
import MemberListPage   from './pages/members/MemberListPage';
import MemberFormPage   from './pages/members/MemberFormPage';
import MemberDetailPage from './pages/members/MemberDetailPage';

// 在 <Routes> 中添加：
<Route path="/members"          element={<MemberListPage />} />
<Route path="/members/new"      element={<MemberFormPage />} />
<Route path="/members/:id"       element={<MemberDetailPage />} />
<Route path="/members/:id/edit" element={<MemberFormPage />} />
```

## 在 server/index.ts 中接入路由

```ts
import membersRouter from './routes/members.js';
app.use('/api/members', membersRouter);
```

## 完成标准

- [ ] API CRUD 全部可用
- [ ] 前端可列表、新建、编辑、查看详情、删除会员
- [ ] 有未归还图书的会员不可删除（返回 409）
