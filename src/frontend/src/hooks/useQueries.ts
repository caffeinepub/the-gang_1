import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DebateState } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

export interface Agent {
  id: bigint;
  name: string;
  isEnabled: boolean;
}

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
      
      // Placeholder principals for the three agents
      // These will be replaced with actual agent canister IDs in future phases
      const skippyPrincipal = Principal.fromText('aaaaa-aa');
      const gladosPrincipal = Principal.fromText('aaaaa-aa');
      const robbyPrincipal = Principal.fromText('aaaaa-aa');
      
      return actor.startBoardroomDebate(userPrompt, skippyPrincipal, gladosPrincipal, robbyPrincipal);
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
      
      // Use placeholder principal for Sensory Cortex
      // This will be replaced with actual canister ID during deployment
      const sensoryCortexPrincipal = Principal.fromText('aaaaa-aa');
      
      return actor.routeDocument(filename, filePreview, fileSize, sensoryCortexPrincipal);
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
      
      // Since backend doesn't have a getAgents function yet, we'll create a static list
      // with all 9 agents and assume they're all enabled by default
      const agents: Agent[] = [
        { id: BigInt(0), name: 'Robby', isEnabled: true },
        { id: BigInt(1), name: 'Skippy', isEnabled: true },
        { id: BigInt(2), name: 'The_Architect', isEnabled: true },
        { id: BigInt(3), name: 'Deep_Thought', isEnabled: true },
        { id: BigInt(4), name: 'GLaDOS', isEnabled: true },
        { id: BigInt(5), name: 'VINCENT', isEnabled: true },
        { id: BigInt(6), name: 'Janet', isEnabled: true },
        { id: BigInt(7), name: 'The_Librarian', isEnabled: true },
        { id: BigInt(8), name: 'Sensory_Cortex', isEnabled: true },
      ];
      
      return agents;
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
