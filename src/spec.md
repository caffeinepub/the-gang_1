# Specification

## Summary
**Goal:** Remove cross-canister calls from the debate function and replace with hardcoded responses to fix IC0536 compilation errors.

**Planned changes:**
- Remove all cross-canister call logic (await agent.askAgent, Actor lookups, Principal ID references) from start_boardroom_debate in backend/main.mo
- Replace debate logic with a hardcoded text string that simulates a multi-agent debate transcript including user prompt and stubbed responses from Skippy, GLaDOS, and Robby
- Update current_state.transcript with the mock transcript and set current_state.is_debating to false
- Remove all Agent Registry lookups for is_enabled checks since agents are now stubbed

**User-visible outcome:** The debate feature will return a hardcoded mock transcript immediately without making any cross-canister calls, allowing the UI to display debate results and verify state transitions cleanly.
