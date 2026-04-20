import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { setupAuth, useAuth } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Books from "@/pages/books";
import BookDetail from "@/pages/book-detail";
import BorrowHistory from "@/pages/borrow-history";
import Wishlist from "@/pages/wishlist";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminBooks from "@/pages/admin-books";
import AdminUsers from "@/pages/admin-users";
import Chat from "@/pages/chat";

setupAuth();

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Redirect to="/dashboard" />;
  return <Layout><Component /></Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/books" component={() => <Layout><Books /></Layout>} />
      <Route path="/books/:id" component={() => <Layout><BookDetail /></Layout>} />
      <Route path="/borrow" component={() => <ProtectedRoute component={BorrowHistory} roles={["student"]} />} />
      <Route path="/wishlist" component={() => <ProtectedRoute component={Wishlist} roles={["student"]} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} roles={["admin", "librarian"]} />} />
      <Route path="/admin/books" component={() => <ProtectedRoute component={AdminBooks} roles={["admin", "librarian"]} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} roles={["admin"]} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={Chat} />} />
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
