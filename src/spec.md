# Specification

## Summary
**Goal:** Remove all access control restrictions from backend functions and add boardroom transcript clearing capability.

**Planned changes:**
- Remove all AccessControl trap blocks from backend/main.mo across all functions (getCallerUserProfile, getUserProfile, saveCallerUserProfile, toggleAgentStatus, abortDebate, start_boardroom_debate, routeDocument, getFileRegistry, topUpSwarm, initializeAgents)
- Fix toggleAgentStatus function to match exact implementation without traps or access control
- Add clearBoardroom function to clear transcript from currentState
- Regenerate frontend declarations after backend changes

**User-visible outcome:** Users can access all backend functions without authentication restrictions, toggle agent status freely, and clear the boardroom transcript on demand.
