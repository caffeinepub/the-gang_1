/**
 * Sovereign Agent State Store
 * Persists agent enabled/disabled state to localStorage.
 * This is the source of truth for kill switches until the backend
 * sovereign auth is resolved.
 */

const STORAGE_KEY = "the_gang_agent_state";

type AgentStateMap = Record<string, boolean>;

export function loadAgentState(): AgentStateMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AgentStateMap;
  } catch {
    return {};
  }
}

export function saveAgentState(state: AgentStateMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function setAgentEnabled(name: string, enabled: boolean): void {
  const current = loadAgentState();
  current[name] = enabled;
  saveAgentState(current);
}

export function getAgentEnabled(name: string, defaultValue = true): boolean {
  const state = loadAgentState();
  return name in state ? state[name] : defaultValue;
}

export function resetAllAgents(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getEnabledAgentNames(): string[] {
  const ALL_AGENTS = [
    "Skippy",
    "GLaDOS",
    "Robby",
    "The_Architect",
    "Deep_Thought",
    "VINCENT",
    "Janet",
    "The_Librarian",
    "Sensory_Cortex",
  ];
  return ALL_AGENTS.filter((name) => getAgentEnabled(name, true));
}
