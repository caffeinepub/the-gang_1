import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type DebateState = {
    isDebating : Bool;
    currentSpeaker : Text;
    transcript : Text;
    emergencyMode : Bool;
  };

  public type AgentType = {
    #generalPurpose;
    #documentRouting;
    #decisionMaking;
    #contentGeneration;
    #dataAnalysis;
    #archiveManagement;
    #cybersecurityToolbox;
    #mathLawAI;
    #researchLibrary;
    #fileOcrSystem;
  };

  public type Agent = {
    id : Nat;
    name : Text;
    isEnabled : Bool;
    lastCycles : ?Nat;
    principalId : ?Text;
    agentType : ?AgentType;
  };

  type FileMetadata = {
    blobHash : Text;
    filename : Text;
    size : Nat;
    assignedAgent : Text;
  };

  let fileRegistry = Map.empty<Text, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var agents = Map.empty<Nat, Agent>();
  var nextAgentId = 0;
  var currentState : DebateState = {
    isDebating = false;
    currentSpeaker = "None";
    transcript = "";
    emergencyMode = false;
  };
  // Implicitly stable via --default-persistent-actors
  var is_steel_rain_active : Bool = false;
  var initialized : Bool = false;

  func prePopulateAgents() {
    let coreAgents : [(Nat, Text, AgentType)] = [
      (0, "Skippy", #generalPurpose),
      (1, "GLaDOS", #documentRouting),
      (2, "Robby", #decisionMaking),
      (3, "The_Architect", #contentGeneration),
      (4, "Deep_Thought", #dataAnalysis),
      (5, "VINCENT", #archiveManagement),
      (6, "Janet", #cybersecurityToolbox),
      (7, "The_Librarian", #mathLawAI),
      (8, "Sensory_Cortex", #researchLibrary),
    ];

    for ((id, name, agentType) in coreAgents.vals()) {
      agents.add(
        id,
        {
          id;
          name;
          isEnabled = true;
          lastCycles = ?0;
          principalId = ?"";
          agentType = ?agentType;
        },
      );
    };
    nextAgentId := 9;
  };

  prePopulateAgents();

  system func postupgrade() {
    if (agents.size() == 0) {
      prePopulateAgents();
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func toggleAgentStatus(agentName : Text, status : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let agentOpt = getAgentByName(agentName);
    switch (agentOpt) {
      case (null) {};
      case (?agent) {
        let updatedAgent = { agent with isEnabled = status };
        agents.remove(agent.id);
        agents.add(agent.id, updatedAgent);
      };
    };
  };

  public query ({ caller }) func getStatus() : async DebateState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view debate status");
    };
    currentState;
  };

  public shared ({ caller }) func abortDebate(userInterruption : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can abort debates");
    };
    currentState := {
      currentState with isDebating = false;
      transcript = currentState.transcript # "\n" # userInterruption;
    };
  };

  func getAgentByName(agentName : Text) : ?Agent {
    let iter = agents.values();
    iter.find(func(agent) { agent.name == agentName });
  };

  func appendSystemMessage(message : Text) {
    currentState := {
      currentState with transcript = currentState.transcript # "\n" # message;
    };
  };

  public shared ({ caller }) func start_boardroom_debate(prompt : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start debates");
    };
    var systemMessage = "SYSTEM: Routing input to boardroom panel agents...\n\n";
    systemMessage #= "Prompt: " # prompt # "\n\n";

    for (agent in agents.values()) {
      systemMessage #= processAgent(agent.name, "This is a stubbed response.");
    };

    systemMessage #= "SYSTEM: Boardroom debate initiated.\n";

    currentState := {
      currentState with transcript = currentState.transcript # "\n" # systemMessage;
    };
    systemMessage;
  };

  func processAgent(agentName : Text, stubbedResponse : Text) : Text {
    let agent = getAgentByName(agentName);
    switch (agent) {
      case (null) {
        agentName # " is currently offline. Bypassing routing segment.\n\n";
      };
      case (?a) {
        if (a.isEnabled) {
          agentName # ": " # stubbedResponse # "\n\n";
        } else {
          agentName # " is currently offline. Bypassing routing segment.\n\n";
        };
      };
    };
  };

  public shared ({ caller }) func routeDocument(filename : Text, blobHash : Text, fileSize : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can route documents");
    };
    // PILLAR 3: Silent uploads - DO NOT append to transcript
    fileRegistry.add(
      filename,
      {
        filename;
        size = fileSize;
        assignedAgent = "StubAgent";
        blobHash;
      },
    );
    "StubAgent";
  };

  public query ({ caller }) func getFileRegistry() : async [(Text, FileMetadata)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view file registry");
    };
    fileRegistry.toArray();
  };

  public shared ({ caller }) func topUpSwarm(_targetCanister : Principal, _amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query ({ caller }) func getAgentRegistry() : async [Agent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view agent registry");
    };
    agents.values().toArray();
  };

  public shared ({ caller }) func initializeAgents() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    prePopulateAgents();
  };

  public shared ({ caller }) func clearBoardroom() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    currentState := { currentState with transcript = "" };
  };

  // Steel Rain Protocol -- emergency mode toggle. Admin only.
  public shared ({ caller }) func toggle_steel_rain() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can activate Steel Rain");
    };
    is_steel_rain_active := not is_steel_rain_active;
    is_steel_rain_active;
  };

  // Returns current Steel Rain status. No auth required per specification.
  public query func get_steel_rain_status() : async Bool {
    is_steel_rain_active;
  };
};
