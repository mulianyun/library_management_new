# 任务 D — React 前端骨架

| 属性 | 值 |
|---|---|
| 阶段 | phase-2-foundation |
| 上游依赖 | A（Vite + React 脚手架已创建） |
| 可并行 | B（数据库层）, C（API 骨架） |
| 下游被依赖 | E, F, G, H |

## 产出文件

```
client/src/main.tsx
client/src/App.tsx
client/src/types/models.ts          # 前端共享类型（与后端一致）
client/src/api/client.ts            # fetch 封装
client/src/components/Layout.tsx    # 页面外层布局
client/src/components/Navbar.tsx    # 顶部导航
client/src/components/Loading.tsx   # 加载状态
client/src/styles/global.css        # 全局样式
```

---

## 1. `client/src/types/models.ts`

与 `server/src/types/models.ts` 完全一致的接口定义。注意：不含 `ApiResponse`（这个是后端内部用的），其他所有接口复制过来：

```ts
export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  published_year: number | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

export interface BookInput {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  published_year?: number;
  category?: string;
  total_copies: number;
}

export interface Member {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  membership_date: string;
  created_at: string;
  updated_at: string;
}

export interface MemberInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface BorrowingRecord {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned';
  created_at: string;
}

export interface BorrowingRecordView extends BorrowingRecord {
  book_title: string;
  member_name: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeBorrows: number;
  overdue: number;
}
```

---

## 2. `client/src/api/client.ts`

封装 fetch，统一处理错误和 JSON 解析。

```ts
const BASE_URL = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(json.error || `HTTP ${res.status}`, res.status);
  }
  return json.data as T;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
```

---

## 3. `client/src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

---

## 4. `client/src/App.tsx`

路由表，下游任务逐步取消注释：

```tsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// ── 下游任务完成后取消各自的注释 ──
// import HomePage           from './pages/HomePage';
// import BookListPage       from './pages/books/BookListPage';
// import BookFormPage       from './pages/books/BookFormPage';
// import BookDetailPage     from './pages/books/BookDetailPage';
// import MemberListPage     from './pages/members/MemberListPage';
// import MemberFormPage     from './pages/members/MemberFormPage';
// import MemberDetailPage   from './pages/members/MemberDetailPage';
// import BorrowingListPage  from './pages/borrowings/BorrowingListPage';
// import BorrowingNewPage   from './pages/borrowings/BorrowingNewPage';
// import BorrowingHistoryPage from './pages/borrowings/BorrowingHistoryPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<div>首页 — 待任务 G 实现</div>} />
        <Route path="/books" element={<div>图书列表 — 待任务 E 实现</div>} />
        <Route path="/members" element={<div>会员列表 — 待任务 F 实现</div>} />
        <Route path="/borrowings" element={<div>借阅列表 — 待任务 H 实现</div>} />
      </Routes>
    </Layout>
  );
}
```

---

## 5. `client/src/components/Layout.tsx`

```tsx
import type { ReactNode } from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}
```

---

## 6. `client/src/components/Navbar.tsx`

```tsx
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',           label: '首页' },
  { to: '/books',      label: '图书管理' },
  { to: '/members',    label: '会员管理' },
  { to: '/borrowings', label: '借阅管理' },
];

export default function Navbar() {
  return (
    <nav style={{
      background: '#1a1a2e', padding: '0 24px', display: 'flex',
      alignItems: 'center', gap: 8, height: 56,
    }}>
      <span style={{ color: '#e94560', fontSize: 20, fontWeight: 700, marginRight: 24 }}>
        📚 图书管理系统
      </span>
      {links.map(l => (
        <NavLink key={l.to} to={l.to}
          style={({ isActive }) => ({
            color: isActive ? '#e94560' : '#ccc',
            textDecoration: 'none', padding: '6px 12px',
            borderRadius: 6, fontWeight: isActive ? 600 : 400,
          })}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## 7. `client/src/components/Loading.tsx`

```tsx
export default function Loading() {
  return <p style={{ textAlign: 'center', padding: 40, color: '#888' }}>加载中...</p>;
}
```

---

## 8. `client/src/styles/global.css`

```css
/* 基础重置 */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
a { color: #e94560; text-decoration: none; }

/* 卡片 */
.card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 24px; margin-bottom: 16px; }

/* 统计卡片网格 */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { text-align: center; }
.stat-card h2 { font-size: 32px; color: #e94560; }

/* 表格 */
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #fafafa; font-weight: 600; }

/* 表单 */
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 4px; font-weight: 500; }
.form-group input, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.form-actions { display: flex; gap: 12px; margin-top: 24px; }

/* 按钮 */
button, .btn { display: inline-block; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-primary { background: #e94560; color: #fff; }
.btn-primary:hover { background: #c73a52; }
.btn-secondary { background: #eee; color: #333; }
.btn-danger { background: #dc3545; color: #fff; }
.btn-sm { padding: 4px 10px; font-size: 13px; }

/* 提示 */
.alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
.alert-error { background: #fff0f0; color: #c00; border: 1px solid #fcc; }
.alert-success { background: #f0fff0; color: #060; border: 1px solid #cfc; }

/* 操作工具栏 */
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
.toolbar input { flex: 1; max-width: 300px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }

/* 逾期标记 */
.badge-overdue { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #dc3545; color: #fff; font-size: 12px; }
.badge-returned { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #28a745; color: #fff; font-size: 12px; }

/* 快捷操作 */
.quick-actions { display: flex; gap: 12px; margin-top: 24px; }
.quick-actions a { padding: 10px 20px; background: #e94560; color: #fff; border-radius: 6px; font-weight: 500; }
```

## 完成标准

- [ ] `cd client && npm run dev` 启动，`http://localhost:5173` 可见导航栏和占位页面
- [ ] 导航栏四个链接可以切换
- [ ] `curl http://localhost:5173/api/health` 代理到后端返回 `{"ok":true}`（需 C 任务也完成）
- [ ] 类型检查通过
