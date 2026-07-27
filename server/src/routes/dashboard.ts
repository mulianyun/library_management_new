import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';
import type { DashboardStats } from '../types/models.js';

const router = Router();

// GET /api/dashboard/stats — 仪表盘统计: 馆藏图书 / 注册会员 / 借出中 / 逾期未还
router.get('/stats', (_req: Request, res: Response) => {
  const stats: DashboardStats = {
    totalBooks: countRows('SELECT COUNT(*) AS c FROM books'),
    totalMembers: countRows('SELECT COUNT(*) AS c FROM members'),
    activeBorrows: countRows(`SELECT COUNT(*) AS c FROM borrowing_records WHERE status = 'borrowed'`),
    overdue: countRows(
      `SELECT COUNT(*) AS c FROM borrowing_records
       WHERE status = 'borrowed' AND due_date < date('now','localtime')`,
    ),
  };
  res.json({ data: stats });
});

export default router;

function countRows(sql: string): number {
  return (db.prepare(sql).get() as { c: number }).c;
}
