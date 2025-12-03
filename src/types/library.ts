export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string | null;
  quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  membership_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Borrowing {
  id: string;
  book_id: string;
  member_id: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  late_fee: number;
  status: 'borrowed' | 'returned' | 'overdue';
  created_at: string;
  updated_at: string;
  book?: Book;
  member?: Member;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  totalRevenue: number;
  booksDueToday: number;
  mostBorrowedBooks: { title: string; count: number }[];
  activeMembers: { name: string; loans: number }[];
}