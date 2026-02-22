# Specification

## Summary
**Goal:** Generate telemetry canister TypeScript declarations and fix the import path in useActor.ts to resolve build errors.

**Planned changes:**
- Run 'dfx generate telemetry' command to generate TypeScript declarations for the telemetry canister
- Verify the actual folder structure of generated declarations
- Correct the import path in frontend/src/hooks/useActor.ts from '../../../declarations/telemetry' to the correct relative path
- Trigger a rebuild to verify the fixes

**User-visible outcome:** The application builds successfully without declaration-related errors, and the telemetry actor is properly imported in the frontend.
