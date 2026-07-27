import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import BookListPage from './pages/books/BookListPage';
import BookFormPage from './pages/books/BookFormPage';
import BookDetailPage from './pages/books/BookDetailPage';

// ── 下游任务完成后取消各自的注释 ──
// import HomePage           from './pages/HomePage';
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
        <Route path="/" element={<p className="text-gray-400 text-center py-10">首页 — 待任务 G 实现</p>} />
        <Route path="/books" element={<BookListPage />} />
        <Route path="/books/new" element={<BookFormPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/books/:id/edit" element={<BookFormPage />} />
        <Route path="/members" element={<p className="text-gray-400 text-center py-10">会员列表 — 待任务 F 实现</p>} />
        <Route path="/members/new" element={<p className="text-gray-400 text-center py-10">添加会员 — 待任务 F 实现</p>} />
        <Route path="/members/:id" element={<p className="text-gray-400 text-center py-10">会员详情 — 待任务 F 实现</p>} />
        <Route path="/members/:id/edit" element={<p className="text-gray-400 text-center py-10">编辑会员 — 待任务 F 实现</p>} />
        <Route path="/borrowings" element={<p className="text-gray-400 text-center py-10">借阅列表 — 待任务 H 实现</p>} />
        <Route path="/borrowings/new" element={<p className="text-gray-400 text-center py-10">借阅图书 — 待任务 H 实现</p>} />
        <Route path="/borrowings/history" element={<p className="text-gray-400 text-center py-10">借阅历史 — 待任务 H 实现</p>} />
      </Routes>
    </Layout>
  );
}
