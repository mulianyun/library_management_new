import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<p className="text-gray-400 text-center py-10">首页 — 待实现</p>} />
        <Route path="/books" element={<p className="text-gray-400 text-center py-10">图书列表 — 待实现</p>} />
        <Route path="/books/new" element={<p className="text-gray-400 text-center py-10">添加图书 — 待实现</p>} />
        <Route path="/books/:id" element={<p className="text-gray-400 text-center py-10">图书详情 — 待实现</p>} />
        <Route path="/books/:id/edit" element={<p className="text-gray-400 text-center py-10">编辑图书 — 待实现</p>} />
        <Route path="/members" element={<p className="text-gray-400 text-center py-10">会员列表 — 待实现</p>} />
        <Route path="/members/new" element={<p className="text-gray-400 text-center py-10">添加会员 — 待实现</p>} />
        <Route path="/members/:id" element={<p className="text-gray-400 text-center py-10">会员详情 — 待实现</p>} />
        <Route
          path="/members/:id/edit"
          element={<p className="text-gray-400 text-center py-10">编辑会员 — 待实现</p>}
        />
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
