module {
  type DebateState = {
    isDebating : Bool;
    currentSpeaker : Text;
    transcript : Text;
  };

  type OldActor = {
    currentState : DebateState;
  };

  type NewActor = {
    currentState : DebateState;
  };

  public func run(old : OldActor) : NewActor {
    { old with currentState = old.currentState };
  };
};
