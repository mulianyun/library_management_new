import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Member } from '@/types/models';

export default function MemberListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    api
      .get<Member[]>(`/members${qs}`)
      .then(setMembers)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  const handleDelete = (member: Member) => {
    if (!window.confirm(`确认删除会员"${member.name}"？此操作不可恢复。`)) return;
    api
      .delete(`/members/${member.id}`)
      .then(() => setMembers((prev) => prev.filter((m) => m.id !== member.id)))
      .catch((e: ApiError) => window.alert(`删除失败: ${e.message}`));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setSearchParams(next ? { search: next } : {}, { replace: true });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">会员管理</h1>
        <Button render={<Link to="/members/new" />}>
          <Plus />
          添加会员
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="搜索姓名"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <Loading />
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
          {search ? '没有匹配的会员' : '暂无会员, 点击右上角添加'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">编号</th>
                <th className="text-left px-4 py-3 font-medium">姓名</th>
                <th className="text-left px-4 py-3 font-medium">邮箱</th>
                <th className="text-left px-4 py-3 font-medium">电话</th>
                <th className="text-left px-4 py-3 font-medium">入会日期</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 tabular-nums text-gray-500">{m.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/members/${m.id}`} className="text-[var(--color-primary)] hover:underline font-medium">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{m.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{m.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.membership_date}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button render={<Link to={`/members/${m.id}`} />}>
                      <Eye />
                      查看
                    </Button>
                    <Button render={<Link to={`/members/${m.id}/edit`} />} className="ml-1">
                      <Pencil />
                      编辑
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(m)} className="ml-1">
                      <Trash2 />
                      删除
                    </Button>
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
