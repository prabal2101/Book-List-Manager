import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Book, LayoutDashboard, Library, Users, Search, BookOpen, MessageCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return <div className="min-h-screen bg-gray-50">{children}</div>;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "librarian", "admin"] },
    { href: "/books", label: "Browse Books", icon: Search, roles: ["student", "librarian", "admin"] },
    { href: "/borrow", label: "My Borrows", icon: BookOpen, roles: ["student"] },
    { href: "/wishlist", label: "Wishlist", icon: Library, roles: ["student"] },
    { href: "/chat", label: "AI Assistant", icon: MessageCircle, roles: ["student", "librarian", "admin"] },
    { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { href: "/admin/books", label: "Manage Books", icon: Book, roles: ["admin", "librarian"] },
    { href: "/admin/users", label: "Manage Users", icon: Users, roles: ["admin"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <Book className="h-6 w-6 text-primary mr-2" />
          <span className="font-semibold text-lg tracking-tight">LibTrack</span>
        </div>
        
        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              location === item.href 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            )}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 bg-white border-b flex items-center px-4 md:hidden">
          <Book className="h-5 w-5 text-primary mr-2" />
          <span className="font-medium">LibTrack</span>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
