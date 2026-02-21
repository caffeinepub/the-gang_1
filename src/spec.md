# Specification

## Summary
**Goal:** Restore Version 34 functionality by reverting recent changes to the Push-to-Talk workflow, dynamic agent routing, and transcript persistence behavior.

**Planned changes:**
- Restore dynamic agent routing in backend that checks Agent Registry is_enabled status and shows offline messages for disabled agents
- Remove transcript clearing logic so conversation history persists across multiple Push-to-Talk sessions
- Remove try/catch/finally error handling wrapper from the boardroom debate backend call
- Add transcript variable back to the useEffect dependency array for speech recognition updates
- Change Push-to-Talk button to use direct function reference syntax instead of arrow function wrapper

**User-visible outcome:** The Push-to-Talk feature will work as it did in Version 34, with persistent transcript history, dynamic agent routing based on enabled/disabled status, and proper speech synthesis triggering when agents respond.
