# Specification

## Summary
**Goal:** Fix React Error 185 infinite loop in the frontend and replace backend debate logic with a hardcoded stub response.

**Planned changes:**
- Move all state setter calls in frontend/src/App.tsx from render body to event handlers or useEffect hooks with proper dependency arrays
- Replace the entire start_boardroom_debate function body in backend/main.mo with a hardcoded return string containing stubbed agent responses
- Remove all agent registry lookups, cross-canister calls, and state updates from start_boardroom_debate

**User-visible outcome:** The boardroom debate interface loads without infinite loop errors, and clicking "Start Debate" returns a stubbed three-agent response instead of causing backend fetch errors.
