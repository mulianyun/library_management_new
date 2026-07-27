import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Book } from '@/types/models';

interface FormState {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  published_year: string;
  category: string;
  total_copies: string;
}

const EMPTY: FormState = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  published_year: '',
  category: '',
  total_copies: '1',
};

export default function BookFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api
      .get<{ book: Book }>(`/books/${id}`)
      .then(({ book }) => {
        setForm({
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          publisher: book.publisher ?? '',
          published_year: book.published_year?.toString() ?? '',
          category: book.category ?? '',
          total_copies: book.total_copies.toString(),
        });
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const totalCopies = parseInt(form.total_copies, 10);
      const yearStr = form.published_year.trim();
      const body = {
        isbn: form.isbn.trim(),
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim() || undefined,
        category: form.category.trim() || undefined,
        total_copies: Number.isFinite(totalCopies) ? totalCopies : 1,
        published_year: yearStr ? parseInt(yearStr, 10) : undefined,
      };
      if (isEdit) {
        await api.put(`/books/${id}`, body);
      } else {
        await api.post('/books', body);
      }
      navigate('/books');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">
        {isEdit ? '编辑图书' : '添加图书'}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="ISBN" required>
          <input
            type="text"
            value={form.isbn}
            onChange={update('isbn')}
            required
            className={inputCls}
          />
        </Field>
        <Field label="书名" required>
          <input
            type="text"
            value={form.title}
            onChange={update('title')}
            required
            className={inputCls}
          />
        </Field>
        <Field label="作者" required>
          <input
            type="text"
            value={form.author}
            onChange={update('author')}
            required
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="出版社">
            <input
              type="text"
              value={form.publisher}
              onChange={update('publisher')}
              className={inputCls}
            />
          </Field>
          <Field label="分类">
            <input
              type="text"
              value={form.category}
              onChange={update('category')}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="出版年份">
            <input
              type="number"
              min={1}
              max={9999}
              value={form.published_year}
              onChange={update('published_year')}
              className={inputCls}
            />
          </Field>
          <Field label="馆藏数量" required>
            <input
              type="number"
              min={1}
              value={form.total_copies}
              onChange={update('total_copies')}
              required
              className={inputCls}
            />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/books')}
            disabled={submitting}
          >
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
