# Specification

## Summary
**Goal:** Fix White Screen of Death regression and ensure transcript clearing on new recordings.

**Planned changes:**
- Wrap backend.start_boardroom_debate() call in try/catch/finally block with error handling and state cleanup
- Add setTranscript([]) as the first line in handlePushToTalk to clear transcript before new recordings
- Hardcode start_boardroom_debate to always return mock responses for Skippy, GLaDOS, and Robby without registry checks

**User-visible outcome:** Push-to-Talk button remains functional even when backend errors occur, transcript window clears completely on each new recording, and all three agents always respond in debates.
