import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Member, BorrowingRecordView } from '@/types/models';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<BorrowingRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get<{ member: Member; records: BorrowingRecordView[] }>(`/members/${id}`)
      .then((res) => {
        setMember(res.member);
        setRecords(res.records);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error)
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md text-sm">{error}</div>
    );
  if (!member)
    return <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">会员不存在</div>;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{member.name}</h1>
          <Button render={<Link to={`/members/${member.id}/edit`} />}>
            <Pencil />
            编辑
          </Button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Detail label="编号" value={String(member.id)} />
          <Detail label="入会日期" value={member.membership_date} />
          <Detail label="邮箱" value={member.email ?? '-'} />
          <Detail label="电话" value={member.phone ?? '-'} />
          <Detail label="地址" value={member.address ?? '-'} span />
        </dl>
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-3">借阅记录</h2>
      {records.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">暂无借阅记录</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">书名</th>
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
                  <td className="px-4 py-3 text-gray-700">{r.borrow_date}</td>
                  <td className="px-4 py-3 text-gray-700">{r.due_date}</td>
                  <td className="px-4 py-3 text-gray-700">{r.return_date ?? '-'}</td>
                  <td className="px-4 py-3">
                    {r.status === 'borrowed' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                        借出中
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
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

function Detail({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{value}</dd>
    </div>
  );
}
