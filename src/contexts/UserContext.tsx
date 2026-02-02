"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Profile {
  id: string;
  role: 'patient' | 'pharmacist';
  full_name: string;
}

interface UserContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string, role: 'patient' | 'pharmacist') => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchProfile(userId: string): Promise<Profile | null> {
    console.log('Fetching profile for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .single();

      console.log('Profile query result:', { data, error });

      if (error) {
        console.error('Profile fetch error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }
      
      if (!data) {
        console.warn('No profile found for user:', userId);
        return null;
      }
      
      console.log('Profile fetched successfully:', data);
      return data;
    } catch (err) {
      console.error('Profile fetch unexpected error:', err);
      return null;
    }
  }

  async function refreshProfile() {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          setUser(data.user);
          setProfile(profileData);
          toast.success("Welcome back!");
          router.replace(profileData.role === "pharmacist" ? "/pharmacy" : "/patient");
          return true;
        } else {
          toast.error("Profile not found. Please contact support.");
          return false;
        }
      }
      return false;
    } catch (err: any) {
      toast.error("Login error: " + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signup(email: string, password: string, fullName: string, role: 'patient' | 'pharmacist'): Promise<boolean> {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: role }
        }
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        const { error: insertError } = await supabase.from('profiles').insert([{
          id: data.user.id,
          role: role,
          full_name: fullName
        }]);

        if (insertError) {
          console.error("Profile creation error:", insertError);
          toast.error("Error creating profile. Please try again.");
          return false;
        }

        if (data.session) {
          const profileData = await fetchProfile(data.user.id);
          setUser(data.user);
          setProfile(profileData);
          toast.success("Account created successfully!");
          router.replace("/patient");
          return true;
        } else {
          toast.success("Account created! Please check your email to verify.");
          return false;
        }
      }
      return false;
    } catch (err: any) {
      toast.error("Signup error: " + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.replace('/');
      toast.success("Logged out successfully");
    } catch (err: any) {
      toast.error("Logout error: " + err.message);
    }
  }

  useEffect(() => {
    let mounted = true;

// Check initial session first
    const checkInitialSession = async () => {
      try {
        console.log('Checking initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Session found:', { session: !!session, user: !!session?.user });
        
        if (session?.user && mounted) {
          console.log('Setting user in context:', session.user.id);
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          
          console.log('Profile data received:', profileData);
          
          if (mounted) {
            setProfile(profileData);
            // Only redirect if we're on landing page AND have a profile
            if (window.location.pathname === '/' && profileData) {
              console.log('Redirecting to dashboard based on role:', profileData.role);
              router.replace(profileData.role === "pharmacist" ? "/pharmacy" : "/patient");
            } else if (window.location.pathname === '/' && !profileData) {
              // User exists but no profile - this might be a data issue
              console.warn('User exists but no profile found');
              toast.error("Profile not found. Please contact support.");
            }
          }
        } else if (mounted) {
          console.log('No session found, setting user to null');
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Initial session check error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkInitialSession();

    // Listen for auth changes after initial check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);

        if (mounted) {
          setProfile(profileData);
          // Only redirect on sign in events
          if (event === 'SIGNED_IN' && profileData) {
            router.replace(profileData.role === "pharmacist" ? "/pharmacy" : "/patient");
          }
        }
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }
      // Ensure loading is always set to false after auth state changes
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const contextValue: UserContextType = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}