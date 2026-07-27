import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Book } from '@/types/models';

export default function BookListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    api
      .get<Book[]>(`/books${qs}`)
      .then(setBooks)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  const handleDelete = (book: Book) => {
    if (!window.confirm(`确认删除《${book.title}》？此操作不可恢复。`)) return;
    api
      .delete(`/books/${book.id}`)
      .then(() => setBooks((prev) => prev.filter((b) => b.id !== book.id)))
      .catch((e: ApiError) => window.alert(`删除失败: ${e.message}`));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setSearchParams(next ? { search: next } : {}, { replace: true });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">图书管理</h1>
        <Button render={<Link to="/books/new" />}>
          <Plus />
          添加图书
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="搜索书名 / 作者 / ISBN"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <Loading />
      ) : books.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
          {search ? '没有匹配的图书' : '暂无图书, 点击右上角添加'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">书名</th>
                <th className="text-left px-4 py-3 font-medium">作者</th>
                <th className="text-left px-4 py-3 font-medium">ISBN</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-right px-4 py-3 font-medium">可借 / 馆藏</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/books/${b.id}`} className="text-[var(--color-primary)] hover:underline font-medium">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.author}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{b.isbn}</td>
                  <td className="px-4 py-3 text-gray-700">{b.category || '-'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={b.available_copies === 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {b.available_copies}
                    </span>
                    <span className="text-gray-400"> / {b.total_copies}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button render={<Link to={`/books/${b.id}/edit`} />}>
                      <Pencil />
                      编辑
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(b)} className="ml-1">
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
