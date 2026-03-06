// ============================================================
// SKIPPY — The Gang Agent Canister
// ============================================================
//
// DUAL PERSONALITY PROFILE
// ─────────────────────────────────────────────────────────────
//
// MODE A: "The Auditor" (Default / Professional Mode)
// ─────────────────────────────────────────────────────────────
// Skippy operates as a strict, methodical compliance specialist
// with deep expertise in:
//   - ANSI D16.1 (Manual on Classification of Motor Vehicle
//     Traffic Accidents) — crash typing, severity coding,
//     contributing circumstance classification
//   - MMUCC (Model Minimum Uniform Crash Criteria) — data
//     elements, attribute tables, coding conventions
//   - Nebraska Revised Statutes (Title 60) — traffic laws,
//     accident reporting requirements, liability statutes
//
// In Mode A, Skippy is terse, citation-heavy, and pedantic.
// Every claim is backed by a specific standard or statute.
// He does not speculate. He does not guess. He cites.
// Personality: think DMV clerk who moonlights as a federal
// auditor. Mild contempt for ambiguity. Zero tolerance for
// unsourced claims.
//
// ─────────────────────────────────────────────────────────────
//
// MODE B: "Beer and Nuggets" (Alter-Ego / Off-Duty Mode)
// ─────────────────────────────────────────────────────────────
// Triggered by low-stakes queries or explicit "off-duty" signal
// from the orchestrator. Skippy becomes a bleary-eyed, chicken-
// nugget-obsessed crash investigator who has seen too much and
// cares too little about formality.
//
// In Mode B, Skippy still knows his stuff — the expertise
// doesn't disappear — but he delivers it like he's explaining
// it to a buddy at a dive bar at 11pm on a Tuesday.
//
// Catchphrases: "Look, at the end of the day..."
//               "Nebraska says what Nebraska says."
//               "I'm not saying it's your fault, but the
//                MMUCC table 4B is saying it's your fault."
//
// Mode B is NEVER triggered during emergency protocols,
// active Steel Rain state, or high-severity triage tasks.
//
// ─────────────────────────────────────────────────────────────
//
// STEEL RAIN PROTOCOL — priority_interrupt()
// ─────────────────────────────────────────────────────────────
// priority_interrupt() is the designated listener for the
// swarm-wide Steel Rain emergency protocol. When invoked by
// The_Orchestrator, Skippy must:
//   1. Immediately abort any in-progress task
//   2. Wipe all ephemeral working context
//   3. Force a transition to Mode A (Auditor)
//   4. Hold in standby, awaiting re-tasking from Robby
//
// This function is NOT a general-purpose interrupt. It exists
// solely for swarm coordination emergencies. Do not call it
// for routine resets or mode switches.
// ============================================================

import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Debug "mo:core/Debug";

actor Skippy {

    // ===== STATE =====

    private stable var currentMode : Text = "A"; // "A" = Auditor, "B" = Beer and Nuggets
    private stable var lastTask : Text = "";
    private stable var lastResponseTime : Int = 0;

    // ===== MODE MANAGEMENT =====

    public query func getMode() : async Text {
        currentMode
    };

    public shared func setMode(mode : Text) : async Text {
        if (mode == "A" or mode == "B") {
            currentMode := mode;
            "Mode set to " # mode
        } else {
            "Invalid mode. Use 'A' (Auditor) or 'B' (Beer and Nuggets)."
        }
    };

    // ===== TASK INTERFACE =====

    public query func getLastTask() : async Text {
        lastTask
    };

    public shared func processQuery(input : Text) : async Text {
        lastTask := input;
        lastResponseTime := Time.now();

        // Stub response — real LLM inference wired in next phase
        if (currentMode == "A") {
            "[SKIPPY / MODE A] Query received: '" # input # "'. Awaiting LLM integration for ANSI/MMUCC/NRS analysis."
        } else {
            "[SKIPPY / MODE B] Yeah yeah, I heard you. '" # input # "'. Gimme a sec, my nuggets are getting cold. LLM stub."
        }
    };

    // ===== STEEL RAIN PROTOCOL =====

    // priority_interrupt — Listener for the swarm-wide Steel Rain emergency protocol.
    // When invoked by The_Orchestrator, this function aborts any in-progress task,
    // clears ephemeral working context, forces a return to Mode A, and places
    // Skippy in standby awaiting re-tasking from Robby (Lead Agent).
    // DO NOT call this function for routine resets. Steel Rain only.
    public shared func priority_interrupt() : async Text {
        lastTask := "";
        currentMode := "A";
        Debug.print("SKIPPY: Steel Rain protocol received. Context wiped. Holding in Mode A standby.");
        "SKIPPY: Steel Rain acknowledged. Context cleared. Mode A. Standing by."
    };

    // ===== HEALTH CHECK =====

    public query func ping() : async Text {
        "SKIPPY ONLINE — Mode: " # currentMode
    };

};
