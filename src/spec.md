# Specification

## Summary
**Goal:** Fix frozen UI state when backend connection fails by adding proper error handling to the debate start flow.

**Planned changes:**
- Wrap backend.start_boardroom_debate() call in try/catch/finally block in handleTranscriptComplete function
- Add console.error logging in catch block to capture connection issues
- Reset debating state to false in finally block to re-enable Push-to-Talk button

**User-visible outcome:** The Push-to-Talk button will automatically re-enable after a backend connection failure, preventing the UI from remaining frozen.
