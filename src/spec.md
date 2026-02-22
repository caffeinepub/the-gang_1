# Specification

## Summary
**Goal:** Add functionality to reset and repopulate agents in the canister to their original configuration.

**Planned changes:**
- Add a `reset_agents()` function in the backend that clears and repopulates the agent registry with the original pre-configured agents
- Create a `useResetAgents` mutation hook in the frontend that calls the backend function and refreshes the agent list
- Add a "Reset Agents" button in the Swarm Health tab above the System Vitals section

**User-visible outcome:** Users can click a "Reset Agents" button in the Swarm Health tab to restore all agents to their original configuration, with the agent table automatically refreshing to show the reset agents.
