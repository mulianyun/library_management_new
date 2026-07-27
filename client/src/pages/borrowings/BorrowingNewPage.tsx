import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Book, Member } from '@/types/models';

const BORROW_DAYS = 30;

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + BORROW_DAYS);
  return d.toISOString().split('T')[0];
}

export default function BorrowingNewPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ member_id: '', book_id: '', due_date: defaultDueDate() });

  useEffect(() => {
    Promise.all([api.get<Member[]>('/members'), api.get<Book[]>('/books')])
      .then(([memberList, bookList]) => {
        setMembers(memberList);
        setBooks(bookList.filter((b) => b.available_copies > 0));
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/borrowings', {
        member_id: parseInt(form.member_id, 10),
        book_id: parseInt(form.book_id, 10),
        due_date: form.due_date,
      });
      navigate('/borrowings');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">借阅图书</h1>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      {members.length === 0 && (
        <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-3 rounded-md mb-4 text-sm">
          暂无会员, 请先{' '}
          <Link to="/members/new" className="underline font-medium">
            添加会员
          </Link>
        </div>
      )}
      {books.length === 0 && (
        <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-3 rounded-md mb-4 text-sm">
          暂无可借图书, 请先{' '}
          <Link to="/books/new" className="underline font-medium">
            添加图书
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="会员" required>
          <select
            value={form.member_id}
            onChange={(e) => setForm((prev) => ({ ...prev, member_id: e.target.value }))}
            required
            className={inputCls}
          >
            <option value="">请选择会员</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="图书" required>
          <select
            value={form.book_id}
            onChange={(e) => setForm((prev) => ({ ...prev, book_id: e.target.value }))}
            required
            className={inputCls}
          >
            <option value="">请选择图书</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} (可借: {b.available_copies})
              </option>
            ))}
          </select>
        </Field>
        <Field label="应还日期" required>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
            required
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting || members.length === 0 || books.length === 0}>
            {submitting ? '提交中...' : '确认借出'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/borrowings')} disabled={submitting}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
