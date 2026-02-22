# Specification

## Summary
**Goal:** Remove all authorization and access control code from the backend by deleting specific import statements, initialization code, and permission check blocks.

**Planned changes:**
- Delete import statements for MixinAuthorization and AccessControl from backend/main.mo
- Delete accessControlState initialization and MixinAuthorization include statement
- Remove all permission check if blocks containing 'AccessControl.hasPermission' from affected functions (toggleAgentStatus, start_boardroom_debate, abortDebate, initializeAgents, clearBoardroom)
- Deploy the modified backend

**User-visible outcome:** Backend functions execute without authorization checks, allowing all users to access previously restricted operations.
