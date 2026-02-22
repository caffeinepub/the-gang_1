# Specification

## Summary
**Goal:** Replace the useActor.ts hook with a dual-actor setup that initializes both the main orchestrator actor and a telemetry side master actor with defensive loading.

**Planned changes:**
- Replace the entire contents of frontend/src/hooks/useActor.ts with the user-provided template
- Implement dual-actor initialization using separate React Query queries for main actor and telemetry actor
- Add defensive error handling for telemetry actor initialization that returns null on failure
- Add environment variable checks for CANISTER_ID_TELEMETRY or VITE_TELEMETRY_CANISTER_ID
- Implement useEffect hook to invalidate dependent queries when main actor changes
- Return object containing actor, telemetryActor, and isFetching properties

**User-visible outcome:** The application will initialize both the main actor and telemetry actor with proper error handling, enabling telemetry functionality without breaking the app if telemetry canister is unavailable.
