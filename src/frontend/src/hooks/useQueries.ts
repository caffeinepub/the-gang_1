import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DebateState, Agent } from '../backend';
import { useActor } from './useActor';

export function useDebateStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<DebateState>({
    queryKey: ['debateStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getStatus();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useStartBoardroomDebate() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userPrompt: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.start_boardroom_debate(userPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useAbortDebate() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userInterruption: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.abortDebate(userInterruption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useClearBoardroom() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.clearBoardroom();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useRouteDocument() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

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
      if (!actor) throw new Error('Actor not initialized');
      return actor.routeDocument(filename, filePreview, fileSize);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useGetAgentStatuses() {
  const { actor, isFetching } = useActor();

  return useQuery<Agent[]>({
    queryKey: ['agentStatuses'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getAgentRegistry() as unknown as Agent[];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useToggleAgentStatus() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ agentName, status }: { agentName: string; status: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.toggleAgentStatus(agentName, status);
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

export function useResetAgents() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.initializeAgents();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentStatuses'] });
    },
    onError: (error) => {
      console.error('Failed to reset agents:', error);
      throw error;
    },
  });
}
