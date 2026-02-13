"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";
import { InventoryItem } from "@/types";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

interface Pharmacy {
  id: string;
  full_name: string;
}

interface Connection {
  pharmacy_id: string;
  profiles: Pharmacy | Pharmacy[];
}

interface PatientMedicationsResponse {
  medications: InventoryItem[];
  pharmacies: Pharmacy[];
}

const fetchPatientMedications = async (userId: string): Promise<PatientMedicationsResponse> => {
  // Fetch connections
  const { data: connections, error: connError } = await supabase
    .from("connections")
    .select("pharmacy_id, profiles:pharmacy_id(id, full_name)")
    .eq("patient_id", userId);

  if (connError) {
    logger.error('usePatientMedications', 'Error fetching connections:', connError);
    throw new Error("Failed to load connections");
  }

  const connData = (connections as Connection[]) || [];
  
  const pharmacies = connData.map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return profile;
  }).filter(Boolean) as Pharmacy[];

  const connectedIds = pharmacies.map((p) => p.id);

  // Fetch medications from connected pharmacies
  let medications: InventoryItem[] = [];
  
  if (connectedIds.length > 0) {
    const { data, error } = await supabase
      .from("inventory")
      .select("*, profiles:pharmacy_id(full_name)")
      .in("pharmacy_id", connectedIds)
      .order("name");

    if (error) {
      logger.error('usePatientMedications', 'Error fetching medications:', error);
      throw new Error("Failed to load medications");
    }

    medications = (data as unknown as InventoryItem[]) || [];
  }

  return {
    medications,
    pharmacies
  };
};

export const usePatientMedications = () => {
  const { user } = useUser();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['patient-medications', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchPatientMedications(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // REMOVED: placeholderData causing infinite loading on tab switch
  });

  return {
    medications: data?.medications || [],
    pharmacies: data?.pharmacies || [],
    loading: isLoading,
    error,
    refetch
  };
};
