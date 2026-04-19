import { useState } from "react";
import { Link } from "wouter";
import { useGetBooks, getGetBooksQueryKey, useBorrowBook, useAddToWishlist } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, BookOpen, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Books() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<string>("all");
  const [page, setPage] = useState(1);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = { 
    page, 
    limit: 12,
    ...(search ? { search } : {}),
    ...(branch !== "all" ? { branch } : {})
  };

  const { data, isLoading } = useGetBooks(queryParams, {
    query: { queryKey: getGetBooksQueryKey(queryParams) }
  });

  const borrowMutation = useBorrowBook();
  const wishlistMutation = useAddToWishlist();

  const handleBorrow = (bookId: number) => {
    borrowMutation.mutate({ data: { bookId } }, {
      onSuccess: () => {
        toast({ title: "Book borrowed successfully" });
        queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to borrow book", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleWishlist = (bookId: number) => {
    wishlistMutation.mutate({ data: { bookId } }, {
      onSuccess: () => {
        toast({ title: "Added to wishlist" });
      },
      onError: (err) => {
        toast({ title: "Failed to add to wishlist", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library Catalog</h1>
          <p className="text-muted-foreground mt-1">Browse and search for books</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, author, subject or ISBN..." 
            className="pl-9 w-full bg-gray-50 border-transparent focus-visible:bg-white"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={branch} onValueChange={(v) => { setBranch(v); setPage(1); }}>
            <SelectTrigger className="bg-gray-50 border-transparent focus:bg-white">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="CSE">Computer Science</SelectItem>
              <SelectItem value="IT">Information Tech</SelectItem>
              <SelectItem value="Civil">Civil</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Card key={i} className="h-[300px] animate-pulse bg-gray-100 border-none shadow-none" />
          ))}
        </div>
      ) : data?.books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-100 border-dashed">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No books found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.books.map((book) => (
              <Card key={book.id} className="flex flex-col border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group">
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 font-normal">
                      {book.branch}
                    </Badge>
                    {book.availability ? (
                      <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5" title="Available"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" title="Borrowed"></span>
                    )}
                  </div>
                  <Link href={`/books/${book.id}`}>
                    <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors line-clamp-2" title={book.title}>
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
                </CardHeader>
                <CardContent className="p-5 pt-0 flex-1">
                  <div className="flex items-start text-xs text-muted-foreground mt-3">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0" />
                    <span>Section {book.section}, Rack {book.rackNumber}, Row {book.rowNumber}, Shelf {book.shelfNumber}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0 mt-auto flex gap-2">
                  <Button 
                    className="flex-1" 
                    variant={book.availability ? "default" : "secondary"}
                    disabled={!book.availability || user?.role !== "student"}
                    onClick={() => handleBorrow(book.id)}
                  >
                    {book.availability ? "Borrow" : "Unavailable"}
                  </Button>
                  {user?.role === "student" && (
                    <Button variant="outline" size="icon" onClick={() => handleWishlist(book.id)} className="shrink-0 border-gray-200 text-gray-600 hover:text-primary hover:border-primary/30">
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {data && data.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
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
    </div>
  );
}
