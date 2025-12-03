import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Member } from '@/types/library';
import { toast } from '@/hooks/use-toast';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('members')
        .insert(member)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Success', description: 'Member added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...member }: Partial<Member> & { id: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update(member)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Success', description: 'Member updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Success', description: 'Member deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}