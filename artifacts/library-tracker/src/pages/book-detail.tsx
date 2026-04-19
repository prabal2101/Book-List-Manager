import { useParams } from "wouter";
import { useGetBook, getGetBookQueryKey, useBorrowBook, useAddToWishlist } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MapPin, Heart, ArrowLeft, Clock } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function BookDetail() {
  const { id } = useParams();
  const bookId = parseInt(id || "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useGetBook(bookId, {
    query: { enabled: !!bookId, queryKey: getGetBookQueryKey(bookId) }
  });

  const borrowMutation = useBorrowBook();
  const wishlistMutation = useAddToWishlist();

  const handleBorrow = () => {
    borrowMutation.mutate({ data: { bookId } }, {
      onSuccess: () => {
        toast({ title: "Book borrowed successfully" });
        queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(bookId) });
      },
      onError: (err) => {
        toast({ title: "Failed to borrow book", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleWishlist = () => {
    wishlistMutation.mutate({ data: { bookId } }, {
      onSuccess: () => {
        toast({ title: "Added to wishlist" });
      },
      onError: (err) => {
        toast({ title: "Failed to add to wishlist", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading book details...</div>;
  }

  if (!book) {
    return <div className="p-8 text-center text-muted-foreground">Book not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/books" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="bg-gray-50 text-gray-600 font-normal">
                  {book.branch}
                </Badge>
                {book.availability ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Available</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">Borrowed</Badge>
                )}
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">{book.title}</CardTitle>
              <CardDescription className="text-lg text-foreground/80 mt-2">{book.author}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Subject</dt>
                  <dd className="mt-1 text-sm text-foreground">{book.subject}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">ISBN</dt>
                  <dd className="mt-1 text-sm text-foreground">{book.isbn || "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Added On</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {book.createdAt ? format(new Date(book.createdAt), 'MMMM d, yyyy') : "N/A"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-gray-200 bg-gray-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Physical Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-md border shadow-sm flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location Path</span>
                <span className="text-lg font-medium text-primary">
                  Section {book.section}
                </span>
                <span className="text-sm font-medium">
                  Rack {book.rackNumber}, Row {book.rowNumber}, Shelf {book.shelfNumber}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-0">
              <Button 
                className="w-full" 
                variant={book.availability ? "default" : "secondary"}
                disabled={!book.availability || user?.role !== "student"}
                onClick={handleBorrow}
              >
                {book.availability ? "Borrow Book" : "Currently Unavailable"}
              </Button>
              {user?.role === "student" && (
                <Button variant="outline" className="w-full" onClick={handleWishlist}>
                  <Heart className="mr-2 h-4 w-4" />
                  Add to Wishlist
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
