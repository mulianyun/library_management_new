import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookDetailPage from './pages/books/BookDetailPage';
import BookFormPage from './pages/books/BookFormPage';
import BookListPage from './pages/books/BookListPage';
import BorrowingHistoryPage from './pages/borrowings/BorrowingHistoryPage';
import BorrowingListPage from './pages/borrowings/BorrowingListPage';
import BorrowingNewPage from './pages/borrowings/BorrowingNewPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BookListPage />} />
        <Route path="/books/new" element={<BookFormPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/books/:id/edit" element={<BookFormPage />} />
        <Route path="/members" element={<p className="text-gray-400 text-center py-10">会员列表 — 待实现</p>} />
        <Route path="/members/new" element={<p className="text-gray-400 text-center py-10">添加会员 — 待实现</p>} />
        <Route path="/members/:id" element={<p className="text-gray-400 text-center py-10">会员详情 — 待实现</p>} />
        <Route
          path="/members/:id/edit"
          element={<p className="text-gray-400 text-center py-10">编辑会员 — 待实现</p>}
        />
        <Route path="/borrowings" element={<BorrowingListPage />} />
        <Route path="/borrowings/new" element={<BorrowingNewPage />} />
        <Route path="/borrowings/history" element={<BorrowingHistoryPage />} />
      </Routes>
    </Layout>
  );
}
