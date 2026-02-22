# Specification

## Summary
**Goal:** Regenerate Candid interface declarations to expose the clearBoardroom method to the frontend.

**Planned changes:**
- Regenerate backend Candid declarations (.did file) to include clearBoardroom method signature
- Synchronize frontend Candid declarations (.did.js and .did.d.ts files) with the updated backend interface

**User-visible outcome:** The React app can successfully call the clearBoardroom method without 'Actor missing' errors, enabling users to clear the boardroom functionality.
