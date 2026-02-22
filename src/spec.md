# Specification

## Summary
**Goal:** Improve Boardroom Text Command Console usability with Enter key submission and auto-scrolling transcript.

**Planned changes:**
- Add onKeyDown handler to Textarea so Enter (without Shift) submits the command instead of adding a new line
- Implement auto-scroll in the transcript container using useRef and useEffect to smoothly scroll to the bottom when new debate messages appear

**User-visible outcome:** Users can press Enter to quickly submit commands (Shift+Enter for new lines), and the debate transcript automatically scrolls to show the latest messages without manual scrolling.
