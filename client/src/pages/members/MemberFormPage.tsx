import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { Member } from '@/types/models';

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const EMPTY: FormState = { name: '', email: '', phone: '', address: '' };

export default function MemberFormPage() {
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
      .get<{ member: Member }>(`/members/${id}`)
      .then(({ member }) => {
        setForm({
          name: member.name,
          email: member.email ?? '',
          phone: member.phone ?? '',
          address: member.address ?? '',
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
      const body = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (isEdit) {
        await api.put(`/members/${id}`, body);
      } else {
        await api.post('/members', body);
      }
      navigate('/members');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">{isEdit ? '编辑会员' : '添加会员'}</h1>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="姓名" required>
          <input type="text" value={form.name} onChange={update('name')} required className={inputCls} />
        </Field>
        <Field label="邮箱">
          <input type="email" value={form.email} onChange={update('email')} className={inputCls} />
        </Field>
        <Field label="电话">
          <input type="text" value={form.phone} onChange={update('phone')} className={inputCls} />
        </Field>
        <Field label="地址">
          <input type="text" value={form.address} onChange={update('address')} className={inputCls} />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/members')} disabled={submitting}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent';

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
