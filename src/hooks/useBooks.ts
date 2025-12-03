import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/library';
import { toast } from '@/hooks/use-toast';

export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'available_quantity'>) => {
      const { data, error } = await supabase
        .from('books')
        .insert({ ...book, available_quantity: book.quantity })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Success', description: 'Book added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...book }: Partial<Book> & { id: string }) => {
      const { data, error } = await supabase
        .from('books')
        .update(book)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Success', description: 'Book updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Success', description: 'Book deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}