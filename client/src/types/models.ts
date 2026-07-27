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
