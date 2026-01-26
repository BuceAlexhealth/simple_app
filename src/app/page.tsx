"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "pharmacist">("patient");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        router.push(profile.role === "pharmacist" ? "/pharmacy" : "/patient");
      } else {
        setInitialLoading(false);
      }
    } else {
      setInitialLoading(false);
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
        setLoading(false);
      } else if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          router.push(profile.role === "pharmacist" ? "/pharmacy" : "/patient");
        }
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: role }
        }
      });

      if (error) {
        alert(error.message);
        setLoading(false);
      } else if (data.user) {
        await supabase.from("profiles").insert([{
          id: data.user.id,
          role: role,
          full_name: fullName
        }]);

        if (data.session) {
          router.push(role === "pharmacist" ? "/pharmacy" : "/patient");
        } else {
          alert("Account created! Please sign in.");
          setIsLogin(true);
          setLoading(false);
        }
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)]">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-slate-500 font-medium">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--app-bg)]">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-[var(--border)]">
        <div className="text-center mb-8">
          <div className="bg-[var(--primary)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
            <Activity className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">PharmaPlus</h1>
          <p className="text-[var(--text-muted)] text-sm">Professional Pharmacy Management</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Register as</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${role === "patient" ? "bg-indigo-50 border-[var(--primary)] text-[var(--primary)]" : "bg-white border-[var(--border)]"}`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("pharmacist")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${role === "pharmacist" ? "bg-indigo-50 border-[var(--primary)] text-[var(--primary)]" : "bg-white border-[var(--border)]"}`}
                  >
                    Pharmacist
                  </button>
                </div>
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isLogin ? <><LogIn className="w-4 h-4" /> Sign In</> : <><UserPlus className="w-4 h-4" /> Create Account</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[var(--primary)] font-semibold hover:underline"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
