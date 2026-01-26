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
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          router.push(profile.role === "pharmacist" ? "/pharmacy" : "/patient");
          return;
        } else if (profileError) {
          console.error("Profile check failed:", profileError);
          if (profileError.code === "PGRST116") {
            alert("Session found but your profile is incomplete. Please try signing out and registering again.");
          }
        }
      }
    } catch (err) {
      console.error("CheckUser error:", err);
    } finally {
      setInitialLoading(false);
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert(error.message);
        } else if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          if (profile) {
            router.push(profile.role === "pharmacist" ? "/pharmacy" : "/patient");
            return;
          } else {
            alert("Profile not found. If you just signed up, wait a moment.");
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
        } else if (data.user) {
          const { error: insertError } = await supabase.from("profiles").insert([{
            id: data.user.id,
            role: role,
            full_name: fullName
          }]);

          if (insertError) {
            console.error("Profile creation error:", insertError);
            alert("Critical Error: Profile could not be created. Please try again or contact support.");
            return;
          }

          if (data.session) {
            router.push(role === "pharmacist" ? "/pharmacy" : "/patient");
            return;
          } else {
            alert("Account created! Please sign in.");
            setIsLogin(true);
          }
        }
      }
    } catch (err: any) {
      alert("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)]">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-slate-500 font-medium tracking-tight">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--app-bg)] text-[var(--text-main)]">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="bg-[var(--primary)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3 transform hover:rotate-0 transition-transform duration-300">
            <Activity className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">PharmaPlus</h1>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-1">Professional Healthcare Portal</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Account Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`flex-1 py-3 rounded-2xl text-xs font-bold border-2 transition-all ${role === "patient" ? "bg-indigo-50 border-[var(--primary)] text-[var(--primary)]" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                    >
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("pharmacist")}
                      className={`flex-1 py-3 rounded-2xl text-xs font-bold border-2 transition-all ${role === "pharmacist" ? "bg-indigo-50 border-[var(--primary)] text-[var(--primary)]" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                    >
                      Pharmacist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Security Password</label>
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
            className="w-full btn-primary h-14 mt-6 flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              <><LogIn className="w-5 h-5" /> <span className="text-base uppercase tracking-widest font-black">Sign In</span></>
            ) : (
              <><UserPlus className="w-5 h-5" /> <span className="text-base uppercase tracking-widest font-black">Register</span></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10 border-t pt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[var(--primary)] font-black uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            {isLogin ? "Create a new account" : "Back to sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
