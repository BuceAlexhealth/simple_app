"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Simplified auth types
interface Profile {
  id: string;
  role: 'patient' | 'pharmacist';
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

interface AuthUser {
  id: string;
  email?: string;
  created_at?: string;
}

// Auth state helper functions
const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log('Fetching profile for user ID:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, email, phone, address, date_of_birth, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      // Profile fetch failed (table may not exist or no profile row)
      // Silently return null - app will fall back to user metadata
      return null;
    }

    console.log('Profile data found:', data); // Debug log
    return data as Profile;
  } catch (err) {
    console.error('Profile fetch unexpected error:', err);
    return null;
  }
};

// React Query key for user data
export const userKeys = {
  user: ['user'] as const,
  profile: (userId: string) => ['profile', userId] as const,
  session: ['session'] as const,
};

// Main auth hook
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query for current user (from Supabase)
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: userKeys.user,
    queryFn: getUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Query for user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: userKeys.profile(authUser?.id || ''),
    queryFn: () => authUser?.id ? fetchProfile(authUser.id) : Promise.resolve(null),
    enabled: !!authUser?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Combined loading state
  const isLoading = authLoading || profileLoading;

  // Login mutation
  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        console.log('Login successful for user:', data.user.email);
        console.log('User metadata:', data.user.user_metadata);
        
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: userKeys.user });
        const profileData = await fetchProfile(data.user.id);
        
        // Get role from user metadata
        const userRole = data.user.user_metadata?.role || 'patient';
        console.log('Profile data:', profileData);
        console.log('User role from metadata:', userRole);
        
        // Normalize role to lowercase for consistent comparison
        const normalizedProfileRole = profileData?.role?.toLowerCase();
        const normalizedUserRole = userRole?.toLowerCase();
        
        if (profileData) {
          queryClient.setQueryData(userKeys.profile(data.user.id), profileData);
          toast.success("Welcome back!");
          console.log('Profile role (normalized):', normalizedProfileRole);
          const redirectPath = normalizedProfileRole === "pharmacist" ? "/pharmacy" : "/patient";
          console.log('Redirecting to:', redirectPath);
          router.replace(redirectPath);
        } else {
          // Use role from metadata when profile doesn't exist
          toast.success("Welcome back!");
          console.log('No profile found, user role (normalized):', normalizedUserRole);
          const redirectPath = normalizedUserRole === "pharmacist" ? "/pharmacy" : "/patient";
          console.log('Redirecting to:', redirectPath);
          router.replace(redirectPath);
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Signup mutation
  const signup = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      fullName, 
      role 
    }: { 
      email: string; 
      password: string; 
      fullName: string; 
      role: 'patient' | 'pharmacist' 
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: role }
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        // Create profile only if table exists
        try {
          const { error: insertError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            role: data.user.user_metadata?.role || 'patient',
            full_name: data.user.user_metadata?.full_name || ''
          }]);

          if (insertError && !insertError.message?.includes('does not exist')) {
            throw new Error(insertError.message);
          }
        } catch (err) {
          // Silently ignore profile creation errors for now
        }

        const profileData = {
          id: data.user.id,
          role: data.user.user_metadata?.role as 'patient' | 'pharmacist',
          full_name: data.user.user_metadata?.full_name as string
        };
        
        queryClient.setQueryData(userKeys.profile(data.user.id), profileData);
        
        // Get role from user metadata
        const userRole = data.user.user_metadata?.role || 'patient';
        
        if (data.session) {
          toast.success("Account created successfully!");
          router.replace(userRole === "pharmacist" ? "/pharmacy" : "/patient");
        } else {
          toast.success("Account created! Please check your email to verify.");
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      router.replace('/');
      toast.success("Logged out successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Refresh profile
  const refreshProfile = async () => {
    if (authUser?.id) {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(authUser.id) });
    }
  };

  return {
    // Data
    user: authUser as AuthUser | null,
    profile: profile as Profile | null,
    loading: isLoading,
    
    // Actions
    login,
    signup,
    logout,
    refreshProfile,
  };
}

// Helper hook to get just user and loading state (for components that need it)
export function useUser() {
  const { user, profile, loading, refreshProfile } = useAuth();
  return { user, profile, loading, refreshProfile };
}

// Helper hook for protected routes
export function useRequireAuth(requiredRole?: 'patient' | 'pharmacist') {
  const { user, profile, loading } = useAuth();
  
  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user && !!profile,
    hasRequiredRole: !requiredRole || profile?.role === requiredRole,
  };
}
