import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Plus, Undo2 } from 'lucide-react';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { BorrowingRecordView } from '@/types/models';

export default function BorrowingListPage() {
  const [borrowings, setBorrowings] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchList = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get<BorrowingRecordView[]>('/borrowings')
      .then(setBorrowings)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchList, [fetchList]);

  const handleReturn = (record: BorrowingRecordView) => {
    if (!window.confirm(`确认归还《${record.book_title}》？`)) return;
    api
      .post(`/borrowings/${record.id}/return`, {})
      .then(fetchList)
      .catch((e: ApiError) => window.alert(`归还失败: ${e.message}`));
  };

  const now = formatLocalDateTime(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">当前借阅</h1>
        <div className="flex gap-2">
          <Button render={<Link to="/borrowings/new" />}>
            <Plus />
            借阅图书
          </Button>
          <Button variant="outline" render={<Link to="/borrowings/history" />}>
            <History />
            借阅历史
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <Loading />
      ) : borrowings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">暂无借出记录</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">书名</th>
                <th className="text-left px-4 py-3 font-medium">借阅人</th>
                <th className="text-left px-4 py-3 font-medium">借出日期</th>
                <th className="text-left px-4 py-3 font-medium">应还日期</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {borrowings.map((b) => {
                const isOverdue = b.due_date < now;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/books/${b.book_id}`} className="text-[var(--color-primary)] hover:underline font-medium">
                        {b.book_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/members/${b.member_id}`} className="text-[var(--color-primary)] hover:underline">
                        {b.member_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{b.borrow_date}</td>
                    <td className={`px-4 py-3 tabular-nums ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                      {b.due_date}
                    </td>
                    <td className="px-4 py-3">
                      {isOverdue ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">逾期</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                          借出中
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" onClick={() => handleReturn(b)}>
                        <Undo2 />
                        归还
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 生成与数据库 datetime('now','localtime') 同格式的本地时间串, 用于逾期比较 */
function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
