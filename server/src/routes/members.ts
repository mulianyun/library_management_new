import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { Member, BorrowingRecordView } from '../types/models.js';
import { validateMemberInput } from './member-input.js';

const router = Router();

// 将路由参数 id 解析为合法正整数, 非法返回 null
function parseId(raw: string | string[]): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(s);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/members — 列表, 可选 ?search= 按 name 模糊匹配
router.get('/', (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  let members: Member[];
  if (search) {
    members = db
      .prepare('SELECT * FROM members WHERE name LIKE ? ORDER BY created_at DESC')
      .all(`%${search}%`) as Member[];
  } else {
    members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all() as Member[];
  }
  res.json({ data: members });
});

// GET /api/members/:id — 详情 + 借阅记录
router.get('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: '无效的会员 ID' });
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const records = db
    .prepare(
      `SELECT br.*, b.title AS book_title, m2.name AS member_name
       FROM borrowing_records br
       JOIN books b ON br.book_id = b.id
       JOIN members m2 ON br.member_id = m2.id
       WHERE br.member_id = ? ORDER BY br.borrow_date DESC`,
    )
    .all(member.id) as BorrowingRecordView[];
  res.json({ data: { member, records } });
});

// POST /api/members — 创建
router.post('/', (req: Request, res: Response) => {
  const input = validateMemberInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.error });
  const { name, email, phone, address } = input.value;
  const result = db
    .prepare('INSERT INTO members (name, email, phone, address) VALUES (?, ?, ?, ?)')
    .run(name, email || null, phone || null, address || null);
  res.status(201).json({ data: { id: Number(result.lastInsertRowid), ok: true } });
});

// PUT /api/members/:id — 更新
router.put('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: '无效的会员 ID' });
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const input = validateMemberInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.error });
  const { name, email, phone, address } = input.value;
  db.prepare(
    `UPDATE members SET name=?, email=?, phone=?, address=?, updated_at=datetime('now','localtime') WHERE id=?`,
  ).run(name, email || null, phone || null, address || null, id);
  res.json({ data: { ok: true } });
});

// DELETE /api/members/:id — 删除
// 有未归还借阅记录时拒绝 (避免悬空外键)
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: '无效的会员 ID' });
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const active = (
    db.prepare(`SELECT COUNT(*) AS c FROM borrowing_records WHERE member_id = ? AND status = 'borrowed'`).get(id) as {
      c: number;
    }
  ).c;
  if (active > 0) return res.status(409).json({ error: '该会员有未归还的图书, 无法删除' });
  const del = db.transaction(() => {
    db.prepare('DELETE FROM borrowing_records WHERE member_id = ?').run(id);
    db.prepare('DELETE FROM members WHERE id = ?').run(id);
  });
  del();
  res.json({ data: { ok: true } });
});

export default router;
