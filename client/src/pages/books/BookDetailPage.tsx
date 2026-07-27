import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Book, BorrowingRecordView } from '@/types/models';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [records, setRecords] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    api
      .get<{ book: Book; records: BorrowingRecordView[] }>(`/books/${id}`)
      .then(({ book, records }) => {
        setBook(book);
        setRecords(records);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) {
    return <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md text-sm">{error}</div>;
  }
  if (!book) {
    return <p className="text-gray-400 text-center py-10">图书不存在</p>;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="text-gray-600 mt-1">作者: {book.author}</p>
          </div>
          <Button render={<Link to={`/books/${book.id}/edit`} />}>
            <Pencil />
            编辑
          </Button>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <DetailRow label="ISBN" value={book.isbn} mono />
          <DetailRow label="出版社" value={book.publisher ?? '-'} />
          <DetailRow label="出版年份" value={book.published_year?.toString() ?? '-'} />
          <DetailRow label="分类" value={book.category ?? '-'} />
          <DetailRow
            label="可借 / 馆藏"
            value={
              <span className="tabular-nums">
                <span className={book.available_copies === 0 ? 'text-red-600 font-medium' : ''}>
                  {book.available_copies}
                </span>
                <span className="text-gray-400"> / {book.total_copies}</span>
              </span>
            }
          />
        </dl>
      </div>

      <h2 className="text-lg font-bold mb-3">借阅记录</h2>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">借阅人</th>
              <th className="text-left px-4 py-3 font-medium">借出日期</th>
              <th className="text-left px-4 py-3 font-medium">应还日期</th>
              <th className="text-left px-4 py-3 font-medium">归还日期</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  暂无借阅记录
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
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
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">借出中</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        已归还
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className={mono ? 'font-mono text-xs' : ''}>{value}</dd>
    </>
  );
}
