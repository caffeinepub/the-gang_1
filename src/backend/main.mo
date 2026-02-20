import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Migration "migration";
(with migration = Migration.run)
actor {
  public type DebateState = {
    isDebating : Bool;
    currentSpeaker : Text;
    transcript : Text;
  };

  var currentState : DebateState = {
    isDebating = false;
    currentSpeaker = "None";
    transcript = "";
  };

  public query ({ caller }) func getStatus() : async DebateState {
    currentState;
  };

  public shared ({ caller }) func abortDebate(userInterruption : Text) : async () {
    currentState := {
      currentState with
      isDebating = false;
      transcript = currentState.transcript # "\n" # userInterruption;
    };
  };

  public shared ({ caller }) func startBoardroomDebate(userPrompt : Text) : async () {
    if (userPrompt.contains(#text "HEM_Override_Key")) {
      currentState := {
        currentState with
        currentSpeaker = "Skippy_Emergency";
        transcript = currentState.transcript # "\nNCD-16 Override Recognized. Drop the snark. What is the emergency?";
        isDebating = false;
      };
      return;
    };

    if (currentState.isDebating) {
      return;
    };

    currentState := { currentState with isDebating = true };
  };

  public shared ({ caller }) func topUpSwarm(targetCanister : Principal, amount : Nat) : async () {
    ignore targetCanister;
    ignore amount;
  };
};
