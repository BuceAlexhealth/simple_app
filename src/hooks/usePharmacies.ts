"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface Pharmacy {
  id: string;
  full_name: string;
  role: string;
}

interface Connection {
  pharmacy_id: string;
  profiles: Pharmacy | Pharmacy[];
}

interface PharmaciesResponse {
  pharmacies: Pharmacy[];
  connectedIds: string[];
}

const fetchPharmacies = async (userId: string): Promise<PharmaciesResponse> => {
  // Fetch all pharmacists/pharmacies
  const { data: pharmaData, error: pharmaError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["pharmacist", "pharmacy"]);

  if (pharmaError) {
    console.error("Error fetching pharmacies:", pharmaError);
    throw new Error("Failed to load pharmacies");
  }

  // Fetch user's connections
  const { data: connData, error: connError } = await supabase
    .from("connections")
    .select("pharmacy_id, profiles:pharmacy_id(id, full_name, role)")
    .eq("patient_id", userId);

  if (connError) {
    console.error("Error fetching connections:", connError);
    throw new Error("Failed to load connections");
  }

  const pharmacies = (pharmaData as Pharmacy[]) || [];
  
  const connectedIds = (connData as Connection[] || []).map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return profile?.id || c.pharmacy_id;
  });

  return {
    pharmacies,
    connectedIds
  };
};

export const usePharmacies = () => {
  const { user } = useUser();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pharmacies', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchPharmacies(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  return {
    pharmacies: data?.pharmacies || [],
    connectedIds: data?.connectedIds || [],
    loading: isLoading,
    error,
    refetch
  };
};
