import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DebateState, Agent } from '../backend';

export function useDebateStatus() {
  return useQuery<DebateState>({
    queryKey: ['debateStatus'],
    queryFn: async () => {
      throw new Error('Actor not initialized');
    },
    enabled: false,
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useStartBoardroomDebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrompt: string) => {
      throw new Error('Actor not initialized');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useAbortDebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userInterruption: string) => {
      throw new Error('Actor not initialized');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useClearBoardroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      throw new Error('Actor not initialized');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useRouteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filename,
      filePreview,
      fileSize,
    }: {
      filename: string;
      filePreview: string;
      fileSize: bigint;
    }) => {
      throw new Error('Actor not initialized');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useGetAgentStatuses() {
  return useQuery<Agent[]>({
    queryKey: ['agentStatuses'],
    queryFn: async (): Promise<Agent[]> => {
      throw new Error('Actor not initialized');
    },
    enabled: false,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useToggleAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentName, status }: { agentName: string; status: boolean }) => {
      throw new Error('Actor not initialized');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentStatuses'] });
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
    onError: (error) => {
      console.error('Failed to toggle agent status:', error);
      throw error;
    },
  });
}
