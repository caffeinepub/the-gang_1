# Specification

## Summary
**Goal:** Fix telemetry actor initialization bug in the useActor hook.

**Planned changes:**
- Add a new useEffect hook in frontend/src/hooks/useActor.ts to initialize the telemetry actor connection
- Dynamically import telemetry declarations and create actor with proper configuration
- Handle identity-based agentOptions when identity exists
- Add error handling for offline telemetry scenarios
- Position the new useEffect above the existing invalidateQueries useEffect

**User-visible outcome:** The telemetry actor will be properly initialized and functional, enabling telemetry data collection throughout the application.
