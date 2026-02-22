import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

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

  var agents = Map.empty<Nat, Agent>();
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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func toggleAgentStatus(agentName : Text, status : Bool) : async () {
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
    currentState;
  };

  public shared ({ caller }) func abortDebate(userInterruption : Text) : async () {
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
    var systemMessage = "SYSTEM: Routing input to boardroom panel agents...\n\n";
    systemMessage #= "Prompt: " # prompt # "\n\n";
    systemMessage #= processAgent("Skippy", "This is a stubbed response.");
    systemMessage #= processAgent("GLaDOS", "This is a stubbed response.");
    systemMessage #= processAgent("Robby", "This is a stubbed response.");
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

  public shared ({ caller }) func routeDocument(filename : Text, filePreview : Text, fileSize : Nat) : async Text {
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
    fileRegistry.toArray();
  };

  public shared ({ caller }) func topUpSwarm(targetCanister : Principal, amount : Nat) : async () {
    ignore targetCanister;
    ignore amount;
  };

  public query ({ caller }) func getAgentRegistry() : async [Agent] {
    agents.values().toArray();
  };

  public shared ({ caller }) func initializeAgents() : async () {
    prePopulateAgents();
  };
};
