import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DebateState, Agent } from '../backend';

export function useDebateStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<DebateState>({
    queryKey: ['debateStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getStatus();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 500, // Poll every 500ms for real-time updates
  });
}

export function useStartBoardroomDebate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrompt: string) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Backend now returns hardcoded responses without cross-canister calls
      return actor.startBoardroomDebate(userPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debateStatus'] });
    },
  });
}

export function useAbortDebate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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

export function useRouteDocument() {
  const { actor } = useActor();
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
    queryFn: async (): Promise<Agent[]> => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.getAgentRegistry();
      return result as unknown as Agent[];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000, // Poll every 2 seconds to keep status updated
  });
}

export function useToggleAgentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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
