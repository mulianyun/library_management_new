import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: number;
  label: string;
  icon: LucideIcon;
  /** 数值高亮色, 如逾期用红色 */
  accent?: 'default' | 'danger';
}

export default function StatCard({ value, label, icon: Icon, accent = 'default' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4">
      <div className="flex items-center justify-center size-11 rounded-lg bg-[var(--color-primary)]/10">
        <Icon className="text-[var(--color-primary)]" size={22} />
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums ${accent === 'danger' && value > 0 ? 'text-red-600' : ''}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
