import { useGetWishlist, getGetWishlistQueryKey, useRemoveFromWishlist, useBorrowBook } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Library, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Wishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useGetWishlist({
    query: { queryKey: getGetWishlistQueryKey() }
  });

  const removeMutation = useRemoveFromWishlist();
  const borrowMutation = useBorrowBook();

  const handleRemove = (bookId: number) => {
    removeMutation.mutate({ bookId }, {
      onSuccess: () => {
        toast({ title: "Removed from wishlist" });
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to remove item", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleBorrow = (bookId: number) => {
    borrowMutation.mutate({ data: { bookId } }, {
      onSuccess: () => {
        toast({ title: "Book borrowed successfully" });
        removeMutation.mutate({ bookId });
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to borrow book", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground mt-1">Books you've saved for later</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-gray-100 border-none shadow-none" />
          ))}
        </div>
      ) : wishlist?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200 border-dashed shadow-sm">
          <Library className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="text-gray-500 mt-1 mb-6">Find books you want to read and save them here.</p>
          <Button asChild>
            <Link href="/books">Browse Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist?.map((item) => (
            <Card key={item.id} className="flex flex-col border-gray-200 shadow-sm">
              <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={item.book?.availability ? "default" : "secondary"} className={item.book?.availability ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                    {item.book?.availability ? "Available" : "Borrowed"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2" onClick={() => handleRemove(item.bookId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Link href={`/books/${item.bookId}`}>
                  <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors mt-2 line-clamp-2">
                    {item.book?.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.book?.author}</p>
              </CardHeader>
              <CardContent className="p-5 pt-3 flex-1">
                <div className="flex items-start text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0" />
                  <span>S:{item.book?.section}, R:{item.book?.rackNumber}, Row:{item.book?.rowNumber}</span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0">
                <Button 
                  className="w-full" 
                  disabled={!item.book?.availability}
                  onClick={() => handleBorrow(item.bookId)}
                >
                  Borrow Book
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
