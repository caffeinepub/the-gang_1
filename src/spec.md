# Specification

## Summary
**Goal:** Prepare the useActor hook to support telemetry actor state management.

**Planned changes:**
- Add useState to the React import statement in useActor.ts
- Add a telemetryActor state variable initialized to null after the queryClient declaration
- Update the return statement to include actor, telemetryActor, and isFetching properties

**User-visible outcome:** The useActor hook will expose a telemetryActor property (currently null) alongside the existing actor data, preparing the foundation for future telemetry integration.
