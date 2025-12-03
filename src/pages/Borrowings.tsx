import { useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BorrowingForm } from '@/components/BorrowingForm';
import { useBorrowings, useCreateBorrowing, useReturnBook } from '@/hooks/useBorrowings';
import { useBooks } from '@/hooks/useBooks';
import { useMembers } from '@/hooks/useMembers';
import { Borrowing } from '@/types/library';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';

const LATE_FEE_PER_DAY = 0.50; // $0.50 per day

export default function Borrowings() {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [returningBorrowing, setReturningBorrowing] = useState<Borrowing | null>(null);

  const { data: borrowings, isLoading } = useBorrowings();
  const { data: books } = useBooks();
  const { data: members } = useMembers();
  const createBorrowing = useCreateBorrowing();
  const returnBook = useReturnBook();

  const filteredBorrowings = borrowings?.filter(borrowing =>
    borrowing.book?.title.toLowerCase().includes(search.toLowerCase()) ||
    borrowing.member?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (data: any) => {
    await createBorrowing.mutateAsync(data);
    setIsFormOpen(false);
  };

  const calculateLateFee = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysLate = differenceInDays(today, due);
    return daysLate > 0 ? daysLate * LATE_FEE_PER_DAY : 0;
  };

  const handleReturn = async () => {
    if (returningBorrowing) {
      const lateFee = calculateLateFee(returningBorrowing.due_date);
      await returnBook.mutateAsync({ id: returningBorrowing.id, late_fee: lateFee });
      setReturningBorrowing(null);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'returned') {
      return <Badge variant="secondary">Returned</Badge>;
    }
    const isOverdue = new Date(dueDate) < new Date();
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Borrowed</Badge>;
  };

  const lateFeeForReturning = returningBorrowing 
    ? calculateLateFee(returningBorrowing.due_date) 
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Borrowings</h1>
            <p className="text-muted-foreground mt-1">Track book loans and returns</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Borrowing
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search borrowings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Borrow Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBorrowings?.map((borrowing) => (
                    <TableRow key={borrowing.id}>
                      <TableCell className="font-medium">{borrowing.book?.title || 'Unknown'}</TableCell>
                      <TableCell>{borrowing.member?.name || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(borrowing.borrow_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(borrowing.due_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {borrowing.return_date 
                          ? format(new Date(borrowing.return_date), 'MMM d, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>${Number(borrowing.late_fee || 0).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(borrowing.status, borrowing.due_date)}</TableCell>
                      <TableCell className="text-right">
                        {borrowing.status === 'borrowed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReturningBorrowing(borrowing)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBorrowings?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No borrowings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* New Borrowing Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">New Borrowing</DialogTitle>
            </DialogHeader>
            <BorrowingForm
              books={books || []}
              members={members || []}
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
              isLoading={createBorrowing.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Return Confirmation Dialog */}
        <Dialog open={!!returningBorrowing} onOpenChange={() => setReturningBorrowing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Return Book</DialogTitle>
              <DialogDescription>
                Confirm return of "{returningBorrowing?.book?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span>Member</span>
                <span className="font-medium">{returningBorrowing?.member?.name}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span>Due Date</span>
                <span className="font-medium">
                  {returningBorrowing && format(new Date(returningBorrowing.due_date), 'MMM d, yyyy')}
                </span>
              </div>
              {lateFeeForReturning > 0 && (
                <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg">
                  <span className="text-destructive font-medium">Late Fee</span>
                  <span className="font-bold text-destructive">${lateFeeForReturning.toFixed(2)}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturningBorrowing(null)}>
                Cancel
              </Button>
              <Button onClick={handleReturn} disabled={returnBook.isPending}>
                {returnBook.isPending ? 'Processing...' : 'Confirm Return'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}