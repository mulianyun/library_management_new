import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookDetailPage from './pages/books/BookDetailPage';
import BookFormPage from './pages/books/BookFormPage';
import BookListPage from './pages/books/BookListPage';
import BorrowingHistoryPage from './pages/borrowings/BorrowingHistoryPage';
import BorrowingListPage from './pages/borrowings/BorrowingListPage';
import BorrowingNewPage from './pages/borrowings/BorrowingNewPage';
import MemberListPage from './pages/members/MemberListPage';
import MemberFormPage from './pages/members/MemberFormPage';
import MemberDetailPage from './pages/members/MemberDetailPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BookListPage />} />
        <Route path="/books/new" element={<BookFormPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/books/:id/edit" element={<BookFormPage />} />
        <Route path="/members" element={<MemberListPage />} />
        <Route path="/members/new" element={<MemberFormPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/members/:id/edit" element={<MemberFormPage />} />
        <Route path="/borrowings" element={<BorrowingListPage />} />
        <Route path="/borrowings/new" element={<BorrowingNewPage />} />
        <Route path="/borrowings/history" element={<BorrowingHistoryPage />} />
      </Routes>
    </Layout>
  );
}
