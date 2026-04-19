import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { setupAuth } from "@/lib/auth";

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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        {() => <Layout><Dashboard /></Layout>}
      </Route>
      <Route path="/dashboard" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/books" component={() => <Layout><Books /></Layout>} />
      <Route path="/books/:id" component={() => <Layout><BookDetail /></Layout>} />
      <Route path="/borrow" component={() => <Layout><BorrowHistory /></Layout>} />
      <Route path="/wishlist" component={() => <Layout><Wishlist /></Layout>} />
      <Route path="/admin" component={() => <Layout><AdminDashboard /></Layout>} />
      <Route path="/admin/books" component={() => <Layout><AdminBooks /></Layout>} />
      <Route path="/admin/users" component={() => <Layout><AdminUsers /></Layout>} />
      <Route path="/chat" component={() => <Layout><Chat /></Layout>} />
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
