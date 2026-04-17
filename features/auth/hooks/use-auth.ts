import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as authService from '@/services/auth-service';
import type { LoginFormValues, SignupFormValues } from '@/types/auth';

const currentUserQueryKey = ['auth', 'current-user'] as const;

export function useCurrentUserQuery(enabled: boolean) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authService.getCurrentUser,
    enabled,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginFormValues) => authService.signIn(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SignupFormValues) => authService.signUp(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
