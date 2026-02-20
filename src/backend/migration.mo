import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  // Migration for adding persistent Agent type including isEnabled field with default true
  type OldActor = {
    fileRegistry : Map.Map<Text, { filename : Text; size : Nat; assignedAgent : Text }>;
    currentState : {
      isDebating : Bool;
      currentSpeaker : Text;
      transcript : Text;
      emergencyMode : Bool;
    };
  };

  type NewAgent = {
    id : Nat;
    name : Text;
    isEnabled : Bool;
  };

  type UserProfile = {
    name : Text;
  };

  type NewActor = {
    fileRegistry : Map.Map<Text, { filename : Text; size : Nat; assignedAgent : Text }>;
    currentState : {
      isDebating : Bool;
      currentSpeaker : Text;
      transcript : Text;
      emergencyMode : Bool;
    };
    agents : Map.Map<Nat, NewAgent>;
    nextAgentId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      agents = Map.empty<Nat, NewAgent>();
      nextAgentId = 0;
      userProfiles = Map.empty<Principal, UserProfile>();
    };
  };
};
