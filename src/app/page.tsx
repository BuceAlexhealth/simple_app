"use client";

import { useState } from "react";
import { Activity, LogIn, UserPlus, Loader2, Pill, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { login, signup, loading, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState<"patient" | "pharmacist">("patient");
  const [fullName, setFullName] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      login.mutate({ email, password });
    } else {
      signup.mutate({ email, password, fullName, role });
      if (!loading) {
        setIsLogin(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin"></div>
          <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[var(--primary)] w-6 h-6" />
        </div>
        <p className="mt-4 text-[var(--text-muted)] font-medium tracking-tight animate-pulse">Initializing PharmaPlus...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--app-bg)] relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[var(--primary)] opacity-10 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[var(--info)] opacity-10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">

        {/* Left Side: Branding & Value Prop */}
        <div className="hidden lg:flex flex-col space-y-8 animate-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
              <Activity className="text-[var(--text-inverse)] w-7 h-7" />
            </div>
            <h1 className="heading-3xl text-[var(--text-main)] text-spacing-tight">PharmaPlus</h1>
          </div>

          <div className="space-y-4">
            <h2 className="heading-3xl md:heading-3xl text-[var(--text-main)] text-spacing-tight leading-tight">
              Healthcare management <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--info)]">reimagined.</span>
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-md leading-relaxed">
              Connect with pharmacies, manage prescriptions, and track your health journey in one premium, secure platform.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-3 p-4 bg-[var(--surface-bg)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div className="p-2 bg-[var(--success-bg)] rounded-lg text-[var(--success)]">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-main)]">Smart Inventory</p>
                <p className="text-caption">Real-time availability</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[var(--surface-bg)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div className="p-2 bg-[var(--info-bg)] rounded-lg text-[var(--info)]">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-main)]">Expert Care</p>
                <p className="text-caption">Direct pharmacist chat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <Card variant="glass" className="w-full max-w-md mx-auto shadow-2xl border-[var(--border-light)] animate-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="text-[var(--text-inverse)] w-6 h-6" />
            </div>
              <CardTitle className="heading-xl mb-1">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to access your account" : "Join thousands of users managing their health"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-label ml-1">Full name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-label ml-1">Email address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-label ml-1">Password</label>
                  {isLogin && <a href="#" className="text-link-underline text-xs">Forgot?</a>}
                </div>
                <Input
                  type="password"
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                 className="w-full h-12 mt-6 text-base transition-all"
                size="lg"
                isLoading={loading}
              >
                {isLogin ? (
                  <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
                ) : (
                  <>Create Account <UserPlus className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-[var(--border-subtle)] bg-[var(--surface-bg)]/50 p-6">
            <div className="text-center text-caption">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-semibold text-[var(--primary)] hover:underline focus:outline-none"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}