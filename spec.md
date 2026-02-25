# Specification

## Summary
**Goal:** Create a new Node.js script at `scripts/init_accountant.js` that initializes the accountant canister's registry with agent Principal IDs fetched from The_Orchestrator.

**Planned changes:**
- Create `scripts/init_accountant.js` that imports from `@dfinity/agent` and `@dfinity/principal`
- Script connects to the IC and queries The_Orchestrator canister for all 9 registered agent Principal IDs
- Script formats the retrieved principals into the array structure expected by the accountant canister's `initializeRegistry(agents)` function
- Script calls `initializeRegistry(agents)` on the accountant canister
- No existing files are modified

**User-visible outcome:** A ready-to-run script exists at `scripts/init_accountant.js` that can be manually executed to populate the accountant canister's registry with the 9 agent principals from The_Orchestrator.
