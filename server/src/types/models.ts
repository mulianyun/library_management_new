/** 图书 */
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

/** 创建/更新图书的输入 */
export interface BookInput {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  published_year?: number;
  category?: string;
  total_copies: number;
}

/** 会员 */
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

/** 创建/更新会员的输入 */
export interface MemberInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/** 借阅记录（数据库原始行） */
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

/** 借阅记录视图（JOIN 后的完整信息，供前端展示） */
export interface BorrowingRecordView extends BorrowingRecord {
  book_title: string;
  member_name: string;
}

/** 仪表盘统计 */
export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeBorrows: number;
  overdue: number;
}

/** API 统一响应格式 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
