# Specification

## Summary
**Goal:** Implement an Agent Registry with kill switches and a Command & Control (C2) dashboard in the Swarm Health tab, allowing the Admin to enable/disable individual AI agents and control debate routing.

**Planned changes:**
- Add `is_enabled` boolean field to Agent data structure in The_Orchestrator backend
- Create `toggle_agent_status` admin function to enable/disable agents
- Add routing guardrails in `start_boardroom_debate` to skip disabled agents and log bypass messages
- Build Agent Registry table in Swarm Health tab displaying all 9 AI agents
- Add toggle switches next to each agent to control their enabled/disabled status
- Display green (#39FF14) and red visual indicators for agent status
- Create React Query mutation hook for toggle operations

**User-visible outcome:** Admins can view all 9 AI agents in a C2 dashboard table within the Swarm Health tab, toggle each agent on/off with visual status indicators, and see disabled agents bypassed in debate transcripts with system messages indicating they are offline.
