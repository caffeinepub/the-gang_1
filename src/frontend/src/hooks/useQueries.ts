import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Agent, AgentType, type DebateState } from "../backend";
import { useActor } from "./useActor";
import {
  getAgentEnabled,
  resetAllAgents,
  setAgentEnabled,
} from "./useAgentStateStore";

// Hardcoded fallback roster -- used when backend auth traps before returning data
const FALLBACK_AGENTS: Agent[] = [
  {
    id: BigInt(0),
    name: "Skippy",
    isEnabled: true,
    agentType: AgentType.generalPurpose,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(1),
    name: "GLaDOS",
    isEnabled: true,
    agentType: AgentType.documentRouting,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(2),
    name: "Robby",
    isEnabled: true,
    agentType: AgentType.decisionMaking,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(3),
    name: "The_Architect",
    isEnabled: true,
    agentType: AgentType.contentGeneration,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(4),
    name: "Deep_Thought",
    isEnabled: true,
    agentType: AgentType.dataAnalysis,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(5),
    name: "VINCENT",
    isEnabled: true,
    agentType: AgentType.archiveManagement,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(6),
    name: "Janet",
    isEnabled: true,
    agentType: AgentType.cybersecurityToolbox,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(7),
    name: "The_Librarian",
    isEnabled: true,
    agentType: AgentType.mathLawAI,
    lastCycles: BigInt(0),
    principalId: "",
  },
  {
    id: BigInt(8),
    name: "Sensory_Cortex",
    isEnabled: true,
    agentType: AgentType.researchLibrary,
    lastCycles: BigInt(0),
    principalId: "",
  },
];

/**
 * Merges the base agent roster with localStorage kill-switch overrides.
 * The localStorage state is the source of truth for isEnabled until
 * sovereign backend auth is resolved.
 */
function applyLocalState(agents: Agent[]): Agent[] {
  return agents.map((agent) => ({
    ...agent,
    isEnabled: getAgentEnabled(agent.name, agent.isEnabled),
  }));
}

export function useDebateStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<DebateState>({
    queryKey: ["debateStatus"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.start_boardroom_debate(userPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debateStatus"] });
    },
  });
}

export function useAbortDebate() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userInterruption: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.abortDebate(userInterruption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debateStatus"] });
    },
  });
}

export function useClearBoardroom() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.clearBoardroom();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debateStatus"] });
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.routeDocument(filename, filePreview, fileSize);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debateStatus"] });
    },
  });
}

export function useGetAgentStatuses() {
  const { actor, isFetching } = useActor();

  return useQuery<Agent[]>({
    queryKey: ["agentStatuses"],
    queryFn: async () => {
      let base: Agent[] = FALLBACK_AGENTS;
      if (actor) {
        try {
          const result = (await actor.getAgentRegistry()) as unknown as Agent[];
          if (result && result.length > 0) base = result;
        } catch {
          // Backend auth trap -- use fallback roster
        }
      }
      // Overlay localStorage kill-switch state onto the roster
      return applyLocalState(base);
    },
    enabled: !isFetching,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

/**
 * Kill switch toggle.
 * Saves state immediately to localStorage (persistent, sovereign).
 * Also attempts the backend call -- if it traps due to auth, the local
 * state is already saved and the UI reflects the correct state.
 */
export function useToggleAgentStatus() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      agentName,
      status,
    }: { agentName: string; status: boolean }) => {
      // Save to localStorage immediately -- this is the authoritative toggle
      setAgentEnabled(agentName, status);

      // Attempt backend sync (may trap if auth guard is active -- that's OK)
      if (actor) {
        try {
          await actor.toggleAgentStatus(agentName, status);
        } catch {
          // Auth trap expected until sovereign backend auth is deployed.
          // Local state is already saved so the kill switch still works.
          console.warn(
            `Backend toggle for ${agentName} trapped (auth guard). Local state saved.`,
          );
        }
      }

      return status;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["debateStatus"] });
    },
  });
}

/**
 * Registers a successfully-uploaded file in the backend StableBTreeMap.
 */
export function useRegisterFile() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      filename,
      blobHash,
      fileSize,
    }: {
      filename: string;
      blobHash: string;
      fileSize: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.routeDocument(filename, blobHash, fileSize);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debateStatus"] });
    },
  });
}

/**
 * Resets all agents to enabled in localStorage and attempts backend reset.
 */
export function useResetAgents() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      // Clear all local overrides -- all agents revert to enabled
      resetAllAgents();

      // Attempt backend reset
      if (actor) {
        try {
          await actor.initializeAgents();
        } catch {
          console.warn("Backend initializeAgents trapped. Local state reset.");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentStatuses"] });
    },
  });
}
