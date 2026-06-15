import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, UserPlus, ShieldCheck, graduationCap, BookOpenCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "librarian", "admin"]),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const registerMutation = useRegister();

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user as Parameters<typeof login>[1]);
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc]">
      {/* Left Panel: Thematic Info (Matches Login Panel) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 flex-col p-12 justify-between">
        <div className="flex items-center gap-2 text-[#0d9488]">
          <Library className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">LibTrack</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-slate-900 leading-tight">
              Start your <span className="text-[#0d9488]">reading journey</span> today.
            </h2>
            <p className="text-lg text-slate-500 max-w-md">
              Create an account to begin tracking your collection and managing your library activity.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="h-10 w-10 rounded-lg bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Secure Access</p>
                <p className="text-sm text-slate-500">Your data is protected with industry standards.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="h-10 w-10 rounded-lg bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488]">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Role-Based Experience</p>
                <p className="text-sm text-slate-500">Tailored views for Students and Librarians.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400 italic">
          "The journey of a thousand miles begins with a single page."
        </div>
      </div>

      {/* Right Panel: Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-8 py-8">
          <div className="lg:hidden flex items-center gap-2 text-[#0d9488] mb-8">
            <Library className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">LibTrack</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-500 text-lg">Join Nitin and the LibTrack community.</p>
          </div>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/40 rounded-2xl">
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-11 border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488]/10 rounded-xl px-4" 
                            placeholder="Name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-11 border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488]/10 rounded-xl px-4" 
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
                        <FormLabel className="text-slate-600">Password</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-11 border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488]/10 rounded-xl px-4" 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">Account Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-slate-200 focus:ring-[#0d9488]/10 rounded-xl px-4">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="student" className="rounded-lg">Student</SelectItem>
                            <SelectItem value="librarian" className="rounded-lg">Librarian</SelectItem>
                            <SelectItem value="admin" className="rounded-lg">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 mt-2" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating your space..." : "Register Now"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0d9488] hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}