import { useGetUsers, getGetUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminUsers() {
  const { data: users, isLoading } = useGetUsers({
    query: { queryKey: getGetUsersQueryKey() }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground mt-1">View all registered users in the system</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>A complete list of students, librarians, and administrators.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Joined On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell></TableRow>
              ) : users?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No users found</TableCell></TableRow>
              ) : (
                users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-muted-foreground">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        user.role === 'admin' ? "bg-primary/10 text-primary border-primary/20" :
                        user.role === 'librarian' ? "bg-orange-100 text-orange-800 border-orange-200" :
                        "bg-gray-50 text-gray-700"
                      }>
                        <span className="capitalize">{user.role}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
