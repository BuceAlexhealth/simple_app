"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Profile fetch unexpected error:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        setUser(data.user);
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
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
  }, [router, fetchProfile]);

  const signup = useCallback(async (email: string, password: string, fullName: string, role: 'patient' | 'pharmacist'): Promise<boolean> => {
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
          setUser(data.user);
          setProfile({ id: data.user.id, role, full_name: fullName });
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
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.replace('/');
      toast.success("Logged out successfully");
    } catch (err: any) {
      toast.error("Logout error: " + err.message);
    }
  }, [router]);

  useEffect(() => {

    // Single auth state handler - simpler and more reliable
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return; // Ignore token refreshes

      if (session?.user) {
        setUser(session.user);

        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);


        // Only redirect if on landing page
        if (!profile || profile.id !== session.user.id) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);

          // Only redirect if on landing page
          if (window.location.pathname === '/' && profileData) {
            router.replace(profileData.role === "pharmacist" ? "/pharmacy" : "/patient");
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router, fetchProfile, profile]);

  const contextValue = React.useMemo<UserContextType>(() => ({
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    refreshProfile,
  }), [user, profile, loading, login, signup, logout, refreshProfile]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}