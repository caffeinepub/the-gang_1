# Specification

## Summary
**Goal:** Fix silent actor creation crashes and eliminate duplicate loading/error guard clauses across the application.

**Planned changes:**
- Wrap createActor logic in try/catch block with console error logging in Auth Context
- Verify createActor and canisterId import path points to correct declarations folder
- Remove all backend/loading guard clauses from main App.tsx layout
- Implement strict early return pattern (isLoading → !isAuthenticated → !backend) at top of Boardroom component
- Implement strict early return pattern (isLoading → !isAuthenticated → !backend) at top of SwarmHealth component
- Implement strict early return pattern (isLoading → !isAuthenticated → !backend) at top of SensoryCortex component

**User-visible outcome:** The application will display clear, single status messages ("Checking session...", "Please authenticate.", or "Actor missing. Check console for errors.") in tab content areas only, while the header/navbar always remains visible. Actor creation errors will be logged to console for debugging.
