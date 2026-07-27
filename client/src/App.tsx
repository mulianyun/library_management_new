import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BookDetailPage from './pages/books/BookDetailPage';
import BookFormPage from './pages/books/BookFormPage';
import BookListPage from './pages/books/BookListPage';
import MemberListPage from './pages/members/MemberListPage';
import MemberFormPage from './pages/members/MemberFormPage';
import MemberDetailPage from './pages/members/MemberDetailPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<p className="text-gray-400 text-center py-10">首页 — 待实现</p>} />
        <Route path="/books" element={<BookListPage />} />
        <Route path="/books/new" element={<BookFormPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/books/:id/edit" element={<BookFormPage />} />
        <Route path="/members" element={<MemberListPage />} />
        <Route path="/members/new" element={<MemberFormPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/members/:id/edit" element={<MemberFormPage />} />
        <Route path="/borrowings" element={<p className="text-gray-400 text-center py-10">借阅列表 — 待实现</p>} />
        <Route path="/borrowings/new" element={<p className="text-gray-400 text-center py-10">借阅图书 — 待实现</p>} />
        <Route
          path="/borrowings/history"
          element={<p className="text-gray-400 text-center py-10">借阅历史 — 待实现</p>}
        />
      </Routes>
    </Layout>
  );
}
