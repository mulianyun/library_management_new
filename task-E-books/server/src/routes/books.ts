import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { Book, BookInput, BorrowingRecordView } from '../types/models.js';

const router = Router();

// GET /api/books — 列表, 可选 ?search= 按 title/author/isbn 模糊匹配
router.get('/', (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  let books: Book[];
  if (search) {
    const q = `%${search}%`;
    books = db
      .prepare(
        `SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?
         ORDER BY created_at DESC`,
      )
      .all(q, q, q) as Book[];
  } else {
    books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all() as Book[];
  }
  res.json({ data: books });
});

// GET /api/books/:id — 详情 + 借阅记录
router.get('/:id', (req: Request, res: Response) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  const records = db
    .prepare(
      `SELECT br.*, b.title AS book_title, m.name AS member_name
       FROM borrowing_records br
       JOIN books b ON br.book_id = b.id
       JOIN members m ON br.member_id = m.id
       WHERE br.book_id = ? ORDER BY br.borrow_date DESC`,
    )
    .all(book.id) as BorrowingRecordView[];
  res.json({ data: { book, records } });
});

// POST /api/books — 创建
router.post('/', (req: Request, res: Response) => {
  const { isbn, title, author, publisher, published_year, category, total_copies } = req.body as BookInput;
  if (!isbn || !title || !author) {
    return res.status(400).json({ error: 'ISBN、书名、作者为必填项' });
  }
  const copies = total_copies || 1;
  const existing = db.prepare('SELECT id FROM books WHERE isbn = ?').get(isbn);
  if (existing) return res.status(409).json({ error: 'ISBN 已存在' });
  db.prepare(
    `INSERT INTO books (isbn, title, author, publisher, published_year, category, total_copies, available_copies)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(isbn, title, author, publisher || null, published_year || null, category || null, copies, copies);
  res.status(201).json({ data: { ok: true } });
});

// PUT /api/books/:id — 更新
// available_copies 算法: 保持"已借出"数量不变, 即 newAvailable = newTotal - (oldTotal - oldAvailable)
router.put('/:id', (req: Request, res: Response) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  const { isbn, title, author, publisher, published_year, category, total_copies } = req.body as BookInput;
  if (!isbn || !title || !author) {
    return res.status(400).json({ error: 'ISBN、书名、作者为必填项' });
  }
  const dup = db.prepare('SELECT id FROM books WHERE isbn = ? AND id != ?').get(isbn, book.id);
  if (dup) return res.status(409).json({ error: 'ISBN 已存在' });
  const copies = total_copies || 1;
  const borrowed = book.total_copies - book.available_copies;
  const newAvailable = Math.max(0, copies - borrowed);
  db.prepare(
    `UPDATE books SET isbn=?, title=?, author=?, publisher=?, published_year=?, category=?,
                     total_copies=?, available_copies=?,
                     updated_at=datetime('now','localtime') WHERE id=?`,
  ).run(isbn, title, author, publisher || null, published_year || null, category || null, copies, newAvailable, book.id);
  res.json({ data: { ok: true } });
});

// DELETE /api/books/:id — 删除
// 有未归还借阅记录时拒绝 (避免悬空外键)
router.delete('/:id', (req: Request, res: Response) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined;
  if (!book) return res.status(404).json({ error: '图书不存在' });
  const active = (
    db.prepare(`SELECT COUNT(*) AS c FROM borrowing_records WHERE book_id = ? AND status = 'borrowed'`).get(
      book.id,
    ) as { c: number }
  ).c;
  if (active > 0) return res.status(409).json({ error: '该图书有未归还的借阅记录, 无法删除' });
  // schema 没有 ON DELETE CASCADE, 先清历史再删书
  db.prepare('DELETE FROM borrowing_records WHERE book_id = ?').run(book.id);
  db.prepare('DELETE FROM books WHERE id = ?').run(book.id);
  res.json({ data: { ok: true } });
});

export default router;
