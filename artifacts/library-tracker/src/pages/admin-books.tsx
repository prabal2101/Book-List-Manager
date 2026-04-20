import { useState } from "react";
import { useGetBooks, getGetBooksQueryKey, useBulkUploadBooks, useDeleteBook, useCreateBook } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  subject: z.string().min(1, "Subject is required"),
  branch: z.enum(["CSE", "IT", "Civil", "Mechanical", "Electrical"]),
  totalCopies: z.coerce.number().int().min(1, "Must have at least 1 copy").default(1),
  section: z.string().min(1, "Section is required"),
  rackNumber: z.string().min(1, "Rack is required"),
  rowNumber: z.string().min(1, "Row is required"),
  shelfNumber: z.string().min(1, "Shelf is required"),
  isbn: z.string().optional(),
});

export default function AdminBooks() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [csvData, setCsvData] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = { page, limit: 10, ...(search ? { search } : {}) };
  
  const { data, isLoading } = useGetBooks(queryParams, {
    query: { queryKey: getGetBooksQueryKey(queryParams) }
  });

  const createMutation = useCreateBook();
  const deleteMutation = useDeleteBook();
  const bulkUploadMutation = useBulkUploadBooks();

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "", author: "", subject: "", branch: "CSE", totalCopies: 1, section: "", rackNumber: "", rowNumber: "", shelfNumber: "", isbn: ""
    }
  });

  const handleCreate = (values: z.infer<typeof bookSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Book created successfully" });
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to create book", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this book?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Book deleted" });
          queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Failed to delete book", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleBulkUpload = () => {
    if (!csvData.trim()) return;
    
    bulkUploadMutation.mutate({ data: { csvData } }, {
      onSuccess: (res) => {
        toast({ 
          title: "Bulk upload completed", 
          description: `Inserted: ${res.inserted}, Failed: ${res.failed}` 
        });
        setIsUploadOpen(false);
        setCsvData("");
        queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Bulk upload failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Books</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove books from the catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Bulk Upload</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Bulk Upload Books</DialogTitle>
                <DialogDescription>
                  Upload multiple books using CSV format.
                  <br/>Format: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">title,author,subject,branch,section,rackNumber,rowNumber,shelfNumber,isbn,totalCopies</code>
                  <br/><span className="text-xs text-muted-foreground">isbn and totalCopies are optional (defaults to 1 copy)</span>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder="The Great Gatsby,F. Scott Fitzgerald,Fiction,CSE,A,1,2,3,9780743273565" 
                  className="min-h-[200px] font-mono text-sm"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleBulkUpload} disabled={bulkUploadMutation.isPending || !csvData.trim()}>
                  {bulkUploadMutation.isPending ? "Uploading..." : "Upload CSV"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Book</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="author" render={({ field }) => (
                      <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="branch" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="CSE">CSE</SelectItem>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="Civil">Civil</SelectItem>
                            <SelectItem value="Mechanical">Mechanical</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage/>
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="isbn" render={({ field }) => (
                      <FormItem><FormLabel>ISBN (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="totalCopies" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Copies</FormLabel>
                        <FormControl><Input type="number" min="1" {...field} /></FormControl>
                        <FormMessage/>
                      </FormItem>
                    )}/>
                  </div>
                  
                  <div className="pt-2 pb-1 border-t"><h4 className="text-sm font-medium">Location Info</h4></div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField control={form.control} name="section" render={({ field }) => (
                      <FormItem><FormLabel>Sec</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="rackNumber" render={({ field }) => (
                      <FormItem><FormLabel>Rack</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="rowNumber" render={({ field }) => (
                      <FormItem><FormLabel>Row</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="shelfNumber" render={({ field }) => (
                      <FormItem><FormLabel>Shelf</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Saving..." : "Save Book"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="py-4 flex flex-row items-center border-b bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search books..." 
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : data?.books.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No books found</TableCell></TableRow>
              ) : (
                data?.books.map(book => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={book.title}>{book.title}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={book.author}>{book.author}</TableCell>
                    <TableCell><Badge variant="outline" className="font-normal bg-gray-50">{book.branch}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Sec:{book.section}, R:{book.rackNumber}, Rw:{book.rowNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {(book as any).availableCopies > 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent w-fit">Available</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-transparent w-fit">Borrowed</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {(book as any).availableCopies ?? 1}/{(book as any).totalCopies ?? 1} copies
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(book.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {data && data.totalPages > 1 && (
          <div className="flex justify-center p-4 border-t gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
            <div className="flex items-center px-2 text-sm text-muted-foreground">Page {page} of {data.totalPages}</div>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
