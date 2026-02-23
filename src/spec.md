# Specification

## Summary
**Goal:** Implement dual-actor system with main backend actor and telemetry actor initialization.

**Planned changes:**
- Populate useActor.ts with dual-actor initialization logic (main backend actor with Identity authentication and telemetry actor via dynamic import)
- Remove all references to reset_agents() function from useQueries.ts
- Update useResetAgents mutation to call actor.initializeAgents() instead of reset_agents()
- Generate telemetry canister declarations using dfx generate telemetry command

**User-visible outcome:** The Reset Agents button continues to function correctly using the updated actor initialization system with dual-actor support.
