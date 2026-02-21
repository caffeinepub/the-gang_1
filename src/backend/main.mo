import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
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

  prePopulateAgents();

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
      currentState with isDebating = false; transcript = currentState.transcript # "\n" # userInterruption;
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

    systemMessage #= processAgent("Skippy", "This is a stubbed response.");
    systemMessage #= processAgent("GLaDOS", "This is a stubbed response.");
    systemMessage #= processAgent("Robby", "This is a stubbed response.");

    systemMessage #= "SYSTEM: Boardroom debate initiated.\n";

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

  public shared ({ caller }) func routeDocument(filename : Text, filePreview : Text, fileSize : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can route documents");
    };

    fileRegistry.add(
      filename,
      {
        filename;
        size = fileSize;
        assignedAgent = "StubAgent";
      },
    );

    currentState := {
      currentState with transcript = currentState.transcript # "\nSYSTEM: File [" # filename # "] processed and routed to StubAgent";
    };

    "StubAgent";
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

  public shared ({ caller }) func initializeAgents() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can initialize agents");
    };
    prePopulateAgents();
  };
};
