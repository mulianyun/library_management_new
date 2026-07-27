import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, BookUp, Users } from 'lucide-react';

import Loading from '@/components/Loading';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { api, type ApiError } from '@/api/client';
import type { DashboardStats } from '@/types/models';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) {
    return <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md text-sm">{error}</div>;
  }
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">概览</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard value={stats.totalBooks} label="馆藏图书" icon={BookOpen} />
        <StatCard value={stats.totalMembers} label="注册会员" icon={Users} />
        <StatCard value={stats.activeBorrows} label="借出中" icon={BookUp} />
        <StatCard value={stats.overdue} label="逾期未还" icon={AlertTriangle} accent="danger" />
      </div>

      <h2 className="text-lg font-bold mb-3">快捷操作</h2>
      <div className="flex flex-wrap gap-3">
        <Button render={<Link to="/books/new" />}>添加图书</Button>
        <Button variant="outline" render={<Link to="/members/new" />}>
          添加会员
        </Button>
        <Button variant="outline" render={<Link to="/borrowings/new" />}>
          借阅图书
        </Button>
      </div>
    </div>
  );
}
