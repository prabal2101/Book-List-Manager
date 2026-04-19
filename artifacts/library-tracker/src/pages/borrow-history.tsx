import { useState } from "react";
import { useGetBorrowHistory, getGetBorrowHistoryQueryKey, useReturnBook } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function BorrowHistory() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const queryParams = { page, limit: 10 };
  
  const { data, isLoading } = useGetBorrowHistory(queryParams, {
    query: { queryKey: getGetBorrowHistoryQueryKey(queryParams) }
  });

  const returnMutation = useReturnBook();

  const handleReturn = (borrowId: number) => {
    returnMutation.mutate({ data: { borrowId } }, {
      onSuccess: () => {
        toast({ title: "Book returned successfully" });
        queryClient.invalidateQueries({ queryKey: getGetBorrowHistoryQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to return book", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Borrows</h1>
        <p className="text-muted-foreground mt-1">View your current and past borrowed books</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Borrow History</CardTitle>
          <CardDescription>A complete log of books you have borrowed</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">Loading history...</div>
          ) : data?.records.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No borrow history</h3>
              <p className="text-gray-500 mt-1">You haven't borrowed any books yet.</p>
              <Button asChild className="mt-4">
                <Link href="/books">Browse Catalog</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Borrowed On</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <Link href={`/books/${record.bookId}`} className="hover:text-primary hover:underline">
                            {record.book?.title}
                          </Link>
                        </TableCell>
                        <TableCell>{format(new Date(record.borrowDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(record.dueDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {record.returnDate ? (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Returned
                            </Badge>
                          ) : record.isOverdue ? (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20">
                              <AlertCircle className="mr-1 h-3 w-3" /> Overdue
                            </Badge>
                          ) : (
                            <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/20">
                              <Clock className="mr-1 h-3 w-3" /> Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!record.returnDate && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReturn(record.id)}
                              disabled={returnMutation.isPending}
                            >
                              Return Book
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {data && data.totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <Button 
                    variant="outline" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 text-sm font-medium text-muted-foreground">
                    Page {page} of {data.totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
