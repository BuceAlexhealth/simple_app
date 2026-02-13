"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

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
  const { data: pharmaData, error: pharmaError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["pharmacist", "pharmacy"]);

  if (pharmaError) {
    logger.error('usePharmacies', 'Error fetching pharmacies:', pharmaError);
    throw new Error("Failed to load pharmacies");
  }

  const { data: connData, error: connError } = await supabase
    .from("connections")
    .select("pharmacy_id, profiles:pharmacy_id(id, full_name, role)")
    .eq("patient_id", userId);

  if (connError) {
    logger.error('usePharmacies', 'Error fetching connections:', connError);
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
    queryKey: queryKeys.pharmacies(user?.id),
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchPharmacies(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  return {
    pharmacies: data?.pharmacies || [],
    connectedIds: data?.connectedIds || [],
    loading: isLoading,
    error,
    refetch
  };
};
