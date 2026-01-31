"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, LogIn, UserPlus, Loader2 } from "lucide-react";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "pharmacist">("patient");
  const [showPharmacyWarning, setShowPharmacyWarning] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          // Use window.location for hard redirect to ensure middleware picks up the session cookie
          window.location.replace(profile.role === "pharmacist" ? "/pharmacy" : "/patient");
          return;
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
            window.location.replace(profile.role === "pharmacist" ? "/pharmacy" : "/patient");
          } else {
            alert("Profile not found. If you just signed up, please wait a moment.");
          }
        }
        } else {
          // Check if user is trying to register as pharmacy
          if (role === "pharmacist") {
            setShowPharmacyWarning(true);
            setLoading(false);
            return;
          }

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
              alert("Error creating profile. Please try again.");
              return;
            }

            if (data.session) {
              window.location.replace("/patient");
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
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:shadow-2xl w-full max-w-md border border-[var(--border)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="bg-[var(--primary)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3 transform hover:rotate-0 transition-transform duration-300">
            <Activity className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">PharmaPlus</h1>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-1">Find Medications • Chat with Pharmacists • Track Orders</p>
          
          {/* Patient Dominance Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              90% of users are patients
            </div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <input
                      type="text"
                      className="input-field text-base sm:text-lg py-3"
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
                      className={`flex-1 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${role === "patient" ? "bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">💊</span>
                        <span>Patient</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("pharmacist")}
                      className={`flex-1 py-2 rounded-2xl text-xs font-bold border-2 transition-all ${role === "pharmacist" ? "bg-indigo-50 border-[var(--primary)] text-[var(--primary)]" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm">🏥</span>
                        <span>Pharmacy</span>
                      </div>
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
              className="input-field text-base sm:text-lg py-3"
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
              className="input-field text-base sm:text-lg py-3"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-16 sm:h-14 mt-6 flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 text-base sm:text-lg"
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

        {/* Pharmacy Access Warning Modal */}
        {showPharmacyWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Healthcare Provider Access</h3>
                <button 
                  onClick={() => setShowPharmacyWarning(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-600 mb-4">
                Pharmacy access requires professional verification. You'll need to provide:
              </p>
              <ul className="text-sm text-slate-500 space-y-2 mb-4">
                <li>• Professional license number</li>
                <li>• Business registration details</li>
                <li>• Verified healthcare credentials</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPharmacyWarning(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPharmacyWarning(false)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  I Understand - Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
