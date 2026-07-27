import { NavLink } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const links = [
  { to: '/', label: '首页' },
  { to: '/books', label: '图书管理' },
  { to: '/members', label: '会员管理' },
  { to: '/borrowings', label: '借阅管理' },
];

export default function Navbar() {
  return (
    <nav className="flex items-center gap-2 h-14 px-6 bg-[var(--color-navbar)]">
      <BookOpen className="text-[var(--color-primary)] mr-4" size={24} />
      <span className="text-[var(--color-primary)] text-xl font-bold mr-6">图书管理系统</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md font-medium transition-colors ${
              isActive ? 'text-[var(--color-primary)] font-semibold' : 'text-gray-300 hover:text-white'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
