"use client";

import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { safeToast } from "@/lib/error-handling";
import { queryKeys } from "@/lib/queryKeys";

type ToastMessage = string | ((data?: unknown) => string);

interface CrudMutationConfig<TData, TError, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: ((variables: TVariables, data: TData) => string[][]) | string[][];
  successMessage?: ToastMessage;
  errorMessage?: ToastMessage | ((error: TError) => string);
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: TError, variables: TVariables, context: TContext) => void;
}

export function useCrudMutation<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown>(
  config: CrudMutationConfig<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient();

  const {
    mutationFn,
    invalidateKeys = [],
    successMessage,
    errorMessage,
    onSuccess: customOnSuccess,
    onError: customOnError,
  } = config;

  const options: UseMutationOptions<TData, TError, TVariables, TContext> = {
    mutationFn,
    onSuccess: (data, variables, context) => {
      const keysToInvalidate = typeof invalidateKeys === 'function' 
        ? invalidateKeys(variables, data) 
        : invalidateKeys;
      
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      if (successMessage) {
        const msg = typeof successMessage === 'function' 
          ? successMessage(data) 
          : successMessage;
        safeToast.success(msg);
      }

      customOnSuccess?.(data, variables, context as TContext);
    },
    onError: (error, variables, context) => {
      let msg = "An error occurred";
      if (errorMessage) {
        if (typeof errorMessage === 'function') {
          msg = errorMessage(error);
        } else {
          msg = errorMessage;
        }
      } else if (error instanceof Error) {
        msg = error.message;
      }
      
      safeToast.error(msg);
      customOnError?.(error, variables, context as TContext);
    },
  };

  return useMutation(options);
}

export function createInvalidateKeys(...keys: string[][]) {
  return keys;
}
