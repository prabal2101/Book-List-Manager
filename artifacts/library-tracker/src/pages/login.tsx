import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, ArrowRight, BookOpen, Search, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user as Parameters<typeof login>[1]);
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc]">
      {/* Left Panel: Thematic/Visual (Matches Dashboard Sidebar Style) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 flex-col p-12 justify-between">
        <div className="flex items-center gap-2 text-[#0d9488]">
          <Library className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">LibTrack</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-slate-900 leading-tight">
              Manage your <span className="text-[#0d9488]">personal library</span> with ease.
            </h2>
            <p className="text-lg text-slate-500 max-w-md">
              Keep track of your borrows, wishlist, and discover new books all in one place.
            </p>
          </div>

          {/* Feature Highlight Cards (Matching your Dashboard UI) */}
          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="h-10 w-10 rounded-lg bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Smart Tracking</p>
                <p className="text-sm text-slate-500">Monitor overdue books and deadlines.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="h-10 w-10 rounded-lg bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488]">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Personal Wishlist</p>
                <p className="text-sm text-slate-500">Save your favorite reads for later.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Built for modern readers. © 2026 LibTrack
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[440px] space-y-8">
          <div className="lg:hidden flex items-center gap-2 text-[#0d9488] mb-8">
            <Library className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">LibTrack</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-lg">Login to access your library activity.</p>
          </div>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/40 rounded-2xl">
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-12 border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488]/10 rounded-xl" 
                            placeholder="example@gmail.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-slate-600">Password</FormLabel>
                        </div>
                        <FormControl>
                          <Input 
                            className="h-12 border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488]/10 rounded-xl" 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login to Account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-slate-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#0d9488] hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}