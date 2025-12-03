import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Borrowing } from '@/types/library';
import { toast } from '@/hooks/use-toast';

export function useBorrowings() {
  return useQuery({
    queryKey: ['borrowings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowings')
        .select('*, book:books(*), member:members(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Borrowing[];
    },
  });
}

export function useCreateBorrowing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (borrowing: { book_id: string; member_id: string; due_date: string }) => {
      const { data, error } = await supabase
        .from('borrowings')
        .insert(borrowing)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Success', description: 'Book borrowed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, late_fee }: { id: string; late_fee: number }) => {
      const { data, error } = await supabase
        .from('borrowings')
        .update({ 
          status: 'returned', 
          return_date: new Date().toISOString().split('T')[0],
          late_fee 
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Success', description: 'Book returned successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [booksRes, membersRes, borrowingsRes] = await Promise.all([
        supabase.from('books').select('*'),
        supabase.from('members').select('*').eq('is_active', true),
        supabase.from('borrowings').select('*, book:books(title), member:members(name)'),
      ]);

      if (booksRes.error) throw booksRes.error;
      if (membersRes.error) throw membersRes.error;
      if (borrowingsRes.error) throw borrowingsRes.error;

      const books = booksRes.data || [];
      const members = membersRes.data || [];
      const borrowings = borrowingsRes.data || [];

      const activeLoans = borrowings.filter(b => b.status === 'borrowed');
      const totalRevenue = borrowings.reduce((sum, b) => sum + (Number(b.late_fee) || 0), 0);
      const booksDueToday = borrowings.filter(b => b.status === 'borrowed' && b.due_date === today);

      // Most borrowed books
      const bookCounts: Record<string, { title: string; count: number }> = {};
      borrowings.forEach(b => {
        const title = b.book?.title || 'Unknown';
        if (!bookCounts[b.book_id]) {
          bookCounts[b.book_id] = { title, count: 0 };
        }
        bookCounts[b.book_id].count++;
      });
      const mostBorrowedBooks = Object.values(bookCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Active members (most loans)
      const memberCounts: Record<string, { name: string; loans: number }> = {};
      borrowings.forEach(b => {
        const name = b.member?.name || 'Unknown';
        if (!memberCounts[b.member_id]) {
          memberCounts[b.member_id] = { name, loans: 0 };
        }
        memberCounts[b.member_id].loans++;
      });
      const activeMembers = Object.values(memberCounts)
        .sort((a, b) => b.loans - a.loans)
        .slice(0, 5);

      return {
        totalBooks: books.reduce((sum, b) => sum + b.quantity, 0),
        totalMembers: members.length,
        activeLoans: activeLoans.length,
        totalRevenue,
        booksDueToday: booksDueToday.length,
        mostBorrowedBooks,
        activeMembers,
      };
    },
  });
}