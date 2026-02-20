import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Migration "migration";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

/* State migration to new actor in with clause */
(with migration = Migration.run)
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

  public type Agent = {
    id : Nat;
    name : Text;
    isEnabled : Bool;
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
  let fileRegistry = Map.empty<Text, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextAgentId = 0;

  public type SensoryCortex = actor {
    askAgent : shared (Text) -> async Text;
  };

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

  // Initialize persistent agents using actor state
  public shared ({ caller }) func initializeAgents() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can initialize agents");
    };

    // Only allow initialization if no agents exist yet
    if (agents.size() == 0) {
      let tempAgents : Map.Map<Nat, Agent> = Map.empty<Nat, Agent>();
      tempAgents.add(0, { id = 0; name = "Skippy"; isEnabled = true });
      tempAgents.add(1, { id = 1; name = "GLaDOS"; isEnabled = true });
      tempAgents.add(2, { id = 2; name = "Robby"; isEnabled = true });

      let iter = tempAgents.entries();
      for ((id, agent) in iter) {
        agents.add(id, agent);
      };

      nextAgentId := 3;
    } else {
      Runtime.trap("Agents have already been initialized.");
    };
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
    // Accessible to all users including guests
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

  // Functions for getAgentByName, checkAgentEnabled, appendSystemMessage, and new startBoardRoomDebate
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

  public shared ({ caller }) func startBoardroomDebate(userPrompt : Text, _skippy : SensoryCortex, _glados : SensoryCortex, _robby : SensoryCortex) : async () {
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

    // Routing logic before setting isDebating to true
    if (not checkAgentEnabled("Skippy")) {
      appendSystemMessage("Skippy is currently offline. Bypassing routing segment.");
    };
    if (not checkAgentEnabled("GLaDOS")) {
      appendSystemMessage("GLaDOS is currently offline. Bypassing routing segment.");
    };
    if (not checkAgentEnabled("Robby")) {
      appendSystemMessage("Robby is currently offline. Bypassing routing segment.");
    };

    currentState := { currentState with isDebating = true };
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
    // Accessible to all users including guests
    fileRegistry.toArray();
  };

  public shared ({ caller }) func topUpSwarm(targetCanister : Principal, amount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can top up canisters");
    };

    ignore targetCanister;
    ignore amount;
  };
};
