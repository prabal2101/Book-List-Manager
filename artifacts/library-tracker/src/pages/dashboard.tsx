import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { useGetActiveBorrows, useGetWishlist, getGetActiveBorrowsQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Library, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const { data: activeBorrows } = useGetActiveBorrows({
    query: { enabled: isAuthenticated, queryKey: getGetActiveBorrowsQueryKey() }
  });
  
  const { data: wishlist } = useGetWishlist({
    query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() }
  });

  if (isLoading) return <div className="p-8 flex justify-center">Loading...</div>;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // Redirect admin/librarian to their specific dashboard
  if (user?.role === "admin") return <Redirect to="/admin" />;
  if (user?.role === "librarian") return <Redirect to="/admin" />;

  const overdueCount = activeBorrows?.filter(b => b.isOverdue).length || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground mt-1">Here is an overview of your library activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Borrows</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBorrows?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Books</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-destructive' : ''}`}>{overdueCount}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wishlist Items</CardTitle>
            <Library className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wishlist?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Borrows</CardTitle>
            <CardDescription>Your currently borrowed books</CardDescription>
          </CardHeader>
          <CardContent>
            {activeBorrows && activeBorrows.length > 0 ? (
              <div className="space-y-4">
                {activeBorrows.slice(0, 5).map(borrow => (
                  <div key={borrow.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{borrow.book?.title}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Due: {format(new Date(borrow.dueDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {borrow.isOverdue && (
                      <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-md">
                        Overdue
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You have no active borrows. <Link href="/books" className="text-primary hover:underline">Find a book</Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Wishlist</CardTitle>
            <CardDescription>Books you saved for later</CardDescription>
          </CardHeader>
          <CardContent>
            {wishlist && wishlist.length > 0 ? (
              <div className="space-y-4">
                {wishlist.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/books/${item.bookId}`} className="font-medium hover:text-primary transition-colors">
                        {item.book?.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{item.book?.author}</p>
                    </div>
                    {item.book?.availability ? (
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-md">
                        Available
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                        Borrowed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Your wishlist is empty.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
