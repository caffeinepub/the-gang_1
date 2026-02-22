# Specification

## Summary
**Goal:** Add session management UI to the Boardroom tab with download transcript and clear boardroom functionality.

**Planned changes:**
- Add useClearBoardroom mutation hook in useQueries.ts that calls actor.clearBoardroom() and invalidates debateStatus query
- Import Download and Trash2 icons from lucide-react in App.tsx
- Add handleDownloadTranscript helper function to download transcript as boardroom-archive.txt
- Change action cards grid layout from 2 columns to 3 columns on medium screens
- Add new "Session Management" card with two buttons: "Download Archive" and "Clear Boardroom"

**User-visible outcome:** Users can download the current boardroom transcript as a text file and clear the boardroom to start a new session using two new buttons in a Session Management card.
