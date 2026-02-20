# Specification

## Summary
**Goal:** Add Internet Identity authentication with UI locks, implement cycle management for canister top-ups, and add an emergency override mechanism to bypass the normal debate flow.

**Planned changes:**
- Integrate @dfinity/auth-client package and add a 'Login with Internet Identity' button to the dashboard
- Implement 'High-Stakes' UI lock in DebateDisplay: hide/blur Robby's transcript output and disable Text-to-Speech unless user is authenticated via Internet Identity
- Import ExperimentalCycles module in the Motoko backend
- Create a public update function `top_up_swarm` in the backend that accepts target_canister (Principal) and amount (Nat) parameters, uses ExperimentalCycles.add(amount) to attach cycles, and sends them to the target canister
- Add assertion in `top_up_swarm` to ensure only an authenticated admin Principal can trigger cycle top-ups
- Add emergency override intercept at the beginning of `start_boardroom_debate` that checks for 'HEM_Override_Key' in user_prompt
- When emergency override is triggered, set current_speaker to 'Skippy_Emergency', append 'NCD-16 Override Recognized. Drop the snark. What is the emergency?' to transcript, and set is_debating to false, bypassing all inter-canister calls

**User-visible outcome:** Users must authenticate with Internet Identity to view Robby's responses and use Text-to-Speech. Admins can manually top up canisters with cycles. Users can trigger an emergency override mode by including 'HEM_Override_Key' in their prompt, which bypasses the normal debate flow and activates a direct emergency response from Skippy.
