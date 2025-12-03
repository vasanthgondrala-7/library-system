import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, Member } from '@/types/library';

const borrowingSchema = z.object({
  book_id: z.string().min(1, 'Please select a book'),
  member_id: z.string().min(1, 'Please select a member'),
  due_date: z.string().min(1, 'Due date is required'),
});

type BorrowingFormValues = z.infer<typeof borrowingSchema>;

interface BorrowingFormProps {
  books: Book[];
  members: Member[];
  onSubmit: (data: BorrowingFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BorrowingForm({ books, members, onSubmit, onCancel, isLoading }: BorrowingFormProps) {
  const availableBooks = books.filter(b => b.available_quantity > 0);
  const activeMembers = members.filter(m => m.is_active);
  
  // Default due date: 14 days from now
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);

  const form = useForm<BorrowingFormValues>({
    resolver: zodResolver(borrowingSchema),
    defaultValues: {
      book_id: '',
      member_id: '',
      due_date: defaultDueDate.toISOString().split('T')[0],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="book_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Book</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableBooks.map(book => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title} by {book.author} ({book.available_quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Borrow Book'}
          </Button>
        </div>
      </form>
    </Form>
  );
}