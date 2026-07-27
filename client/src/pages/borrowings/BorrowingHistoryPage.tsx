import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { BorrowingRecordView } from '@/types/models';

export default function BorrowingHistoryPage() {
  const [records, setRecords] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<BorrowingRecordView[]>('/borrowings/history')
      .then(setRecords)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">借阅历史</h1>
        <Button variant="outline" render={<Link to="/borrowings" />}>
          <ArrowLeft />
          当前借阅
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <Loading />
      ) : records.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">暂无记录</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">书名</th>
                <th className="text-left px-4 py-3 font-medium">借阅人</th>
                <th className="text-left px-4 py-3 font-medium">借出日期</th>
                <th className="text-left px-4 py-3 font-medium">应还日期</th>
                <th className="text-left px-4 py-3 font-medium">归还日期</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/books/${r.book_id}`} className="text-[var(--color-primary)] hover:underline font-medium">
                      {r.book_title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/members/${r.member_id}`} className="text-[var(--color-primary)] hover:underline">
                      {r.member_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{r.borrow_date}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{r.due_date}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{r.return_date ?? '-'}</td>
                  <td className="px-4 py-3">
                    {r.status === 'borrowed' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">借出中</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        已归还
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
