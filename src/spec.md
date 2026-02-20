# Specification

## Summary
**Goal:** Sync the Swarm Health Dashboard agent registry table with the backend by dynamically loading agent data and reflecting real-time enabled/disabled status changes.

**Planned changes:**
- Add `is_enabled` field to Agent record in backend with default value of true
- Create `get_agent_registry()` query function in backend to return all agents with their status
- Update AgentRegistryTable component to fetch agent data from backend on mount using useActor hook
- Replace hardcoded table rows with dynamic rendering by mapping over fetched agents state
- Connect Toggle components to reflect actual `is_enabled` values from backend
- Add onChange handlers to toggles that call `toggle_agent_status()` and refresh the agent list
- Ensure UI updates immediately after status changes without page refresh

**User-visible outcome:** The Swarm Health tab now displays live agent data from the backend. When users toggle an agent's status, the change is persisted to the backend and the UI updates instantly to show the new enabled/disabled state with green or red indicators.
