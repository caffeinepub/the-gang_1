# Specification

## Summary
**Goal:** Reset workspace to baseline state by clearing useActor.ts and reverting backend to Version 56 Golden Master.

**Planned changes:**
- Empty the file frontend/src/hooks/useActor.ts, removing all current content
- Remove reset_agents() function from backend/main.mo if it exists and was added after Version 56
- Revert backend/main.mo to match the Golden Master state

**User-visible outcome:** The workspace will be in a clean baseline state with useActor.ts empty and the backend matching the original Version 56 configuration.
