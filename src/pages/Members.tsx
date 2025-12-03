import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MemberForm } from '@/components/MemberForm';
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { Member } from '@/types/library';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function Members() {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const filteredMembers = members?.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (data: any) => {
    if (editingMember) {
      await updateMember.mutateAsync({ id: editingMember.id, ...data });
    } else {
      await createMember.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleDelete = async () => {
    if (deletingMember) {
      await deleteMember.mutateAsync(deletingMember.id);
      setDeletingMember(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Members</h1>
            <p className="text-muted-foreground mt-1">Manage library members</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone || '-'}</TableCell>
                      <TableCell>{format(new Date(member.membership_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingMember(member);
                              setIsFormOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingMember(member)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMembers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingMember(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </DialogTitle>
            </DialogHeader>
            <MemberForm
              member={editingMember || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingMember(null);
              }}
              isLoading={createMember.isPending || updateMember.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deletingMember?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}