import { useGetAdminDashboard, getGetAdminDashboardQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Book, Users, BookOpen, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 10 }, {
    query: { queryKey: getGetRecentActivityQueryKey({ limit: 10 }) }
  });

  if (isLoadingDashboard || isLoadingActivity) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of library operations and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
            <Book className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalBooks || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Borrows</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activeBorrows || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboard?.overdueBorrows || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Branch Statistics</CardTitle>
            <CardDescription>Book distribution and availability across branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.branchStats.map(stat => (
                <div key={stat.branch} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.branch}</span>
                    <span className="text-muted-foreground">{stat.total} books ({stat.borrowed} borrowed)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(stat.available / stat.total) * 100}%` }}
                      title={`${stat.available} available`}
                    />
                    <div 
                      className="h-full bg-orange-400" 
                      style={{ width: `${(stat.borrowed / stat.total) * 100}%` }}
                      title={`${stat.borrowed} borrowed`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Most Borrowed</CardTitle>
            <CardDescription>Popular books right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.mostBorrowedBooks.map((book, i) => (
                <div key={book.id} className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="font-bold text-muted-foreground w-4">{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                    {book.borrowCount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity?.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                <div className="mt-0.5">
                  {activity.type === 'borrow' && <BookOpen className="h-4 w-4 text-orange-500" />}
                  {activity.type === 'return' && <Book className="h-4 w-4 text-green-500" />}
                  {activity.type === 'register' && <Users className="h-4 w-4 text-blue-500" />}
                  {activity.type === 'book_added' && <TrendingUp className="h-4 w-4 text-purple-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
