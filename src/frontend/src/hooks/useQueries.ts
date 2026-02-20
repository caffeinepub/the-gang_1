import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DebateState } from '../backend';

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
