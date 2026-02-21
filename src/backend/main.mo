import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

// Authorization + Storage
actor {
  include MixinStorage();

  // Initialize the access control system
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
    filename : Text;
    size : Nat;
    assignedAgent : Text;
  };

  var currentState : DebateState = {
    isDebating = false;
    currentSpeaker = "None";
    transcript = "";
    emergencyMode = false;
  };

  let agents = Map.empty<Nat, Agent>();
  var nextAgentId = 0;

  let fileRegistry = Map.empty<Text, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public type SensoryCortex = actor {
    askAgent : shared (Text) -> async Text;
  };

  // Pre-populate the 9 core agents upon initialization
  private func prePopulateAgents() {
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
          id = id;
          name = name;
          isEnabled = true;
          lastCycles = ?0;
          principalId = ?"";
          agentType = ?agentType;
        },
      );
    };
    nextAgentId := 9;
  };

  // Initialize agents on first deployment
  prePopulateAgents();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can toggle agent status");
    };

    let agentOpt = getAgentByName(agentName);
    switch (agentOpt) {
      case (null) {
        Runtime.trap("Agent with name " # agentName # " not found.");
      };
      case (?agent) {
        let updatedAgent = { agent with isEnabled = status };
        agents.add(agent.id, updatedAgent);
      };
    };
  };

  public query ({ caller }) func getStatus() : async DebateState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access debate status");
    };
    currentState;
  };

  public shared ({ caller }) func abortDebate(userInterruption : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can abort debates");
    };

    currentState := {
      currentState with
      isDebating = false;
      transcript = currentState.transcript # "\n" # userInterruption;
    };
  };

  func getAgentByName(agentName : Text) : ?Agent {
    let iter = agents.values();
    let agentOpt = iter.find(func(agent) { agent.name == agentName });
    agentOpt;
  };

  func checkAgentEnabled(agentName : Text) : Bool {
    switch (getAgentByName(agentName)) {
      case (null) { false };
      case (?agent) { agent.isEnabled };
    };
  };

  func appendSystemMessage(message : Text) {
    currentState := {
      currentState with transcript = currentState.transcript # "\n" # message;
    };
  };

  public shared ({ caller }) func startBoardroomDebate(
    userPrompt : Text,
    skippy : SensoryCortex,
    glados : SensoryCortex,
    robby : SensoryCortex,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start debates");
    };

    if (userPrompt.contains(#text "HEM_Override_Key")) {
      currentState := {
        currentState with
        currentSpeaker = "Skippy_Emergency";
        transcript = currentState.transcript # "\nNCD-16 Override Recognized. Drop the snark. What is the emergency?";
        isDebating = false;
      };
      return;
    };

    if (userPrompt.contains(#text "Steel Rain")) {
      currentState := { currentState with emergencyMode = true };
    };

    if (userPrompt.contains(#text "Stand Down")) {
      if (currentState.emergencyMode) {
        currentState := {
          currentState with
          emergencyMode = false;
          transcript = currentState.transcript # "\nEmergency Override lifted. Returning to Boardroom protocol.";
          isDebating = false;
        };
        return;
      };
    };

    if (currentState.isDebating) {
      return;
    };

    // Hardcoded routing for Skippy, GLaDOS, and Robby - Append in sequence
    let skippyResponse = await skippy.askAgent(userPrompt);
    let gladosResponse = await glados.askAgent(userPrompt);
    let robbyResponse = await robby.askAgent(userPrompt);

    currentState := {
      currentState with
      transcript = currentState.transcript # "\nSkippy: " # skippyResponse # "\nGLaDOS: " # gladosResponse # "\nRobby: " # robbyResponse;
      isDebating = true;
    };
  };

  public shared ({ caller }) func routeDocument(filename : Text, filePreview : Text, fileSize : Nat, sensoryCortex : SensoryCortex) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can route documents");
    };

    let prompt = "Analyze this text and reply with ONLY the target agent name (Skippy, The_Architect, or Staging): " # filePreview;
    let agentName = await sensoryCortex.askAgent(prompt);

    fileRegistry.add(
      filename,
      {
        filename;
        size = fileSize;
        assignedAgent = agentName;
      },
    );

    currentState := {
      currentState with transcript = currentState.transcript # "\nSYSTEM: File [" # filename # "] processed and routed to " # agentName;
    };

    agentName;
  };

  public query ({ caller }) func getFileRegistry() : async [(Text, FileMetadata)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access file registry");
    };
    fileRegistry.toArray();
  };

  public shared ({ caller }) func topUpSwarm(targetCanister : Principal, amount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can top up canisters");
    };

    ignore targetCanister;
    ignore amount;
  };

  public query ({ caller }) func getAgentRegistry() : async [Agent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access agent registry");
    };
    agents.values().toArray();
  };

  // System initialization with all 9 agents
  public shared ({ caller }) func initializeAgents() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can initialize agents");
    };
    // Re-initialize agents if needed
    prePopulateAgents();
  };
};
