import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { Book, BorrowingRecord, BorrowingRecordView } from '../types/models.js';
import { validateBorrowingInput } from './borrowing-input.js';

const router = Router();

const VIEW_SELECT = `
  SELECT br.*, b.title AS book_title, m.name AS member_name
  FROM borrowing_records br
  JOIN books b ON br.book_id = b.id
  JOIN members m ON br.member_id = m.id
`;

// GET /api/borrowings — 当前借阅列表 (按应还日期升序, 最紧迫的在前)
router.get('/', (_req: Request, res: Response) => {
  const records = db
    .prepare(`${VIEW_SELECT} WHERE br.status = 'borrowed' ORDER BY br.due_date ASC`)
    .all() as BorrowingRecordView[];
  res.json({ data: records });
});

// GET /api/borrowings/history — 借阅历史, 可选 ?member_id= / ?book_id= 过滤
router.get('/history', (req: Request, res: Response) => {
  const { member_id: memberId, book_id: bookId } = req.query as { member_id?: string; book_id?: string };
  const conditions: string[] = [];
  const params: string[] = [];
  if (memberId) {
    conditions.push('br.member_id = ?');
    params.push(memberId);
  }
  if (bookId) {
    conditions.push('br.book_id = ?');
    params.push(bookId);
  }
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const records = db
    .prepare(`${VIEW_SELECT}${where} ORDER BY br.borrow_date DESC`)
    .all(...params) as BorrowingRecordView[];
  res.json({ data: records });
});

// POST /api/borrowings — 借书 (事务中扣减 available_copies)
router.post('/', (req: Request, res: Response) => {
  const result = validateBorrowingInput(req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });
  const { member_id: memberId, book_id: bookId, due_date: dueDate } = result.value;

  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId);
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const book = db.prepare('SELECT id, available_copies FROM books WHERE id = ?').get(bookId) as
    | Pick<Book, 'id' | 'available_copies'>
    | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  if (book.available_copies < 1) return res.status(409).json({ error: '该图书已全部借出' });

  db.transaction(() => {
    db.prepare('INSERT INTO borrowing_records (book_id, member_id, due_date) VALUES (?, ?, ?)').run(
      bookId,
      memberId,
      dueDate,
    );
    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId);
  })();
  res.status(201).json({ data: { ok: true } });
});

// POST /api/borrowings/:id/return — 还书 (事务中恢复 available_copies)
router.post('/:id/return', (req: Request, res: Response) => {
  const record = db.prepare('SELECT * FROM borrowing_records WHERE id = ?').get(req.params.id) as
    | BorrowingRecord
    | undefined;
  if (!record) return res.status(404).json({ error: '借阅记录不存在' });
  if (record.status === 'returned') return res.status(409).json({ error: '该记录已归还' });

  db.transaction(() => {
    db.prepare(
      `UPDATE borrowing_records SET return_date = datetime('now','localtime'), status = 'returned' WHERE id = ?`,
    ).run(record.id);
    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(record.book_id);
  })();
  res.json({ data: { ok: true } });
});

export default router;
