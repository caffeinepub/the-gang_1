# Specification

## Summary
**Goal:** Fix agent registry mutability in the backend to enable persistent agent status changes.

**Planned changes:**
- Change the agents map declaration from 'let' to 'var' in backend/main.mo to make it mutable
- Update the toggleAgentStatus function to explicitly reassign the updated map to the agents state variable

**User-visible outcome:** Agent kill switch toggles will now persist their state correctly, allowing users to enable/disable agents and have those changes maintained across function calls.
