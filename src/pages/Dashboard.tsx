import { BookOpen, Users, ArrowLeftRight, DollarSign, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useBorrowings';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your library</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your library</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Books"
            value={stats?.totalBooks || 0}
            icon={BookOpen}
            description="In collection"
          />
          <StatCard
            title="Total Members"
            value={stats?.totalMembers || 0}
            icon={Users}
            description="Active members"
          />
          <StatCard
            title="Active Loans"
            value={stats?.activeLoans || 0}
            icon={ArrowLeftRight}
            description="Currently borrowed"
          />
          <StatCard
            title="Late Fee Revenue"
            value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
            icon={DollarSign}
            description="Total collected"
          />
          <StatCard
            title="Due Today"
            value={stats?.booksDueToday || 0}
            icon={Clock}
            description="Books to return"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display">Most Borrowed Books</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.mostBorrowedBooks && stats.mostBorrowedBooks.length > 0 ? (
                <div className="space-y-4">
                  {stats.mostBorrowedBooks.map((book, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium truncate max-w-[200px]">{book.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{book.count} borrows</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No borrowing data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display">Most Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.activeMembers && stats.activeMembers.length > 0 ? (
                <div className="space-y-4">
                  {stats.activeMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs font-semibold text-accent">
                          {index + 1}
                        </span>
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{member.loans} loans</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No member activity yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}