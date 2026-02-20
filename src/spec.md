# Specification

## Summary
**Goal:** Simplify the Sensory Cortex upload interface by removing the Principal input field and ensuring file uploads route through The_Orchestrator backend.

**Planned changes:**
- Remove the "SENSORY CORTEX CANISTER PRINCIPAL" input field and all associated state from the SensoryCortexTab component
- Update the "START UPLOAD" button to only require a selected file (no Principal validation)
- Fix the upload flow to send 1.8MB chunks directly to The_Orchestrator's upload_chunk function
- Call The_Orchestrator's route_document function with the filename and first 5,000 characters when upload completes

**User-visible outcome:** Users can upload files to the Sensory Cortex tab by simply selecting a file and clicking "START UPLOAD" without needing to enter a Principal ID. The upload will process through the backend Orchestrator.
