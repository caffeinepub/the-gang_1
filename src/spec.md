# Specification

## Summary
**Goal:** Fix backend map persistence for agent status toggles and remove all access control authentication barriers.

**Planned changes:**
- Change the map update logic in toggleAgentStatus to use agents.put() or agents.remove() + agents.add() pattern to ensure proper overwriting of existing entries
- Remove all AccessControl trap blocks from every backend function to allow execution without authentication checks

**User-visible outcome:** Agent status toggles will persist correctly without duplicates or stale data, and all backend functions will execute successfully from the UI without access control errors.
