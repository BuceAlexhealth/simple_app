"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Invoice, InvoiceStatus } from "@/types";
import { handleAsyncError, safeToast } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { useUser } from "@/hooks/useAuth";

export interface UseInvoicesOptions {
  dateFrom?: string;
  dateTo?: string;
  status?: InvoiceStatus;
  searchQuery?: string;
}

const fetchInvoices = async (pharmacyId: string, options?: UseInvoicesOptions): Promise<Invoice[]> => {
  const { invoices } = createRepositories(supabase);
  const data = await handleAsyncError(
    () => invoices.getInvoicesByPharmacy(pharmacyId, {
      dateFrom: options?.dateFrom,
      dateTo: options?.dateTo,
      status: options?.status,
      searchQuery: options?.searchQuery
    }),
    "Failed to fetch invoices"
  );
  return data || [];
};

export const useInvoices = (options: UseInvoicesOptions = {}) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', user?.id, options],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchInvoices(user.id, options);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) => {
      const { invoices } = createRepositories(supabase);
      const success = await handleAsyncError(
        () => invoices.updateInvoiceStatus(invoiceId, status),
        `Failed to update invoice status to ${status}`
      );
      return success;
    },
    onSuccess: () => {
      safeToast.success("Invoice status updated");
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
    },
    onError: (error: Error) => {
      safeToast.error(error.message || "Failed to update invoice status");
    }
  });

  return {
    invoices,
    loading: isLoading,
    error,
    refetch,
    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync
  };
};

export const useInvoiceByOrder = (orderId: string) => {
  const { invoices } = createRepositories(supabase);

  return useQuery({
    queryKey: ['invoice', 'order', orderId],
    queryFn: () => handleAsyncError(
      () => invoices.getInvoiceByOrderId(orderId),
      "Failed to fetch invoice"
    ),
    enabled: !!orderId,
  });
};
