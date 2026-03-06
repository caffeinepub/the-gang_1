// Deep_Thought.mo - The Accountant
// Standalone canister for cycle management and fiscal reporting

import Cycles "mo:core/Cycles";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Debug "mo:core/Debug";

actor DeepThought {

    // ===== TYPE DEFINITIONS =====

    type CanisterInfo = {
        principal: Principal;
        name: Text;
        lastChecked: Int;
        lastBalance: Nat;
        lastTopUpAmount: Nat;
        lastTopUpTime: Int;
        totalCyclesReceived: Nat;
        checkCount: Nat;
    };

    // ===== STABLE STORAGE =====

    var masterBalance: Nat = 0;
    var canisterRegistry: [CanisterInfo] = [];
    var totalTopUps: Nat = 0;
    var totalCyclesDistributed: Nat = 0;

    // ===== CONSTANTS =====

    let CRITICAL_THRESHOLD: Nat = 2_000_000_000_000; // 2T cycles
    let TOP_UP_AMOUNT: Nat = 3_000_000_000_000; // 3T cycles
    let WARNING_THRESHOLD: Nat = 5_000_000_000_000; // 5T cycles
    let HEALTHY_THRESHOLD: Nat = 10_000_000_000_000; // 10T cycles

    // ===== INITIALIZATION =====

    public shared func initializeRegistry(agents: [(Text, Principal)]) : async Text {
        let now = Time.now();
        canisterRegistry := agents.map(
            func(agent : (Text, Principal)) : CanisterInfo {
                {
                    principal = agent.1;
                    name = agent.0;
                    lastChecked = now;
                    lastBalance = 0;
                    lastTopUpAmount = 0;
                    lastTopUpTime = 0;
                    totalCyclesReceived = 0;
                    checkCount = 0;
                }
            }
        );
        "Registry initialized with " # canisterRegistry.size().toText() # " canisters"
    };

    // ===== CYCLE RESERVOIR MANAGEMENT =====

    public shared func acceptCycles() : async Nat {
        let available = Cycles.available();
        let accepted = Cycles.accept<system>(available);
        masterBalance += accepted;
        accepted
    };

    public query func getMasterBalance() : async Nat {
        masterBalance
    };

    public shared func withdrawCycles(amount: Nat) : async Bool {
        if (masterBalance >= amount) {
            masterBalance -= amount;
            let _ = Cycles.burn<system>(amount);
            true
        } else {
            false
        }
    };

    // ===== MONITORING FUNCTIONS =====

    public shared func monitorBalances() : async [(Text, Nat, Text)] {
        var results: [(Text, Nat, Text)] = [];
        let now = Time.now();

        for (canister in canisterRegistry.vals()) {
            let canisterActor = actor(canister.principal.toText()): actor {
                wallet_balance: () -> async Nat
            };

            try {
                let balance = await canisterActor.wallet_balance();

                let status = if (balance < CRITICAL_THRESHOLD) {
                    "CRITICAL"
                } else if (balance < WARNING_THRESHOLD) {
                    "WARNING"
                } else if (balance < HEALTHY_THRESHOLD) {
                    "CAUTION"
                } else {
                    "HEALTHY"
                };

                results := results.concat([(canister.name, balance, status)]);

                canisterRegistry := canisterRegistry.map(
                    func(c : CanisterInfo) : CanisterInfo {
                        if (Principal.equal(c.principal, canister.principal)) {
                            {
                                principal = c.principal;
                                name = c.name;
                                lastChecked = now;
                                lastBalance = balance;
                                lastTopUpAmount = c.lastTopUpAmount;
                                lastTopUpTime = c.lastTopUpTime;
                                totalCyclesReceived = c.totalCyclesReceived;
                                checkCount = c.checkCount + 1;
                            }
                        } else {
                            c
                        }
                    }
                );

            } catch (_e) {
                Debug.print("Error checking " # canister.name);
                results := results.concat([(canister.name, 0, "ERROR")]);
            };
        };

        results
    };

    // ===== AUTO TOP-UP FUNCTION =====

    public shared func autoTopUp() : async [(Text, Bool, Text)] {
        var results: [(Text, Bool, Text)] = [];
        let now = Time.now();

        for (canister in canisterRegistry.vals()) {
            let canisterActor = actor(canister.principal.toText()): actor {
                wallet_balance: () -> async Nat;
                wallet_receive: () -> async Nat;
            };

            try {
                let balance = await canisterActor.wallet_balance();

                if (balance < CRITICAL_THRESHOLD) {
                    if (masterBalance >= TOP_UP_AMOUNT) {
                        let _ = Cycles.burn<system>(TOP_UP_AMOUNT);
                        let accepted = await canisterActor.wallet_receive();

                        masterBalance -= TOP_UP_AMOUNT;
                        totalTopUps += 1;
                        totalCyclesDistributed += TOP_UP_AMOUNT;

                        canisterRegistry := canisterRegistry.map(
                            func(c : CanisterInfo) : CanisterInfo {
                                if (Principal.equal(c.principal, canister.principal)) {
                                    {
                                        principal = c.principal;
                                        name = c.name;
                                        lastChecked = c.lastChecked;
                                        lastBalance = balance + accepted;
                                        lastTopUpAmount = accepted;
                                        lastTopUpTime = now;
                                        totalCyclesReceived = c.totalCyclesReceived + accepted;
                                        checkCount = c.checkCount;
                                    }
                                } else {
                                    c
                                }
                            }
                        );

                        results := results.concat([
                            (canister.name, true, "Topped up with " # formatCycles(accepted))
                        ]);
                    } else {
                        results := results.concat([
                            (canister.name, false, "Insufficient master balance")
                        ]);
                    }
                } else {
                    results := results.concat([
                        (canister.name, false, "Balance healthy")
                    ]);
                }

            } catch (_e) {
                results := results.concat([
                    (canister.name, false, "ERROR")
                ]);
            };
        };

        results
    };

    // ===== REPORTING FUNCTIONS =====

    public query func generateBurnReport() : async Text {
        var report = "\n========================================\n";
        report #= "DEEP THOUGHT - FISCAL ANALYSIS REPORT\n";
        report #= "========================================\n\n";

        report #= "Master Balance: " # formatCycles(masterBalance) # "\n";
        report #= "Total Top-Ups: " # totalTopUps.toText() # "\n";
        report #= "Total Distributed: " # formatCycles(totalCyclesDistributed) # "\n\n";

        report #= "CANISTER STATUS:\n";
        report #= "----------------------------------------\n";

        for (canister in canisterRegistry.vals()) {
            report #= "\n" # canister.name # ":\n";
            report #= "  Balance: " # formatCycles(canister.lastBalance) # "\n";

            let status = if (canister.lastBalance < CRITICAL_THRESHOLD) {
                "CRITICAL"
            } else if (canister.lastBalance < WARNING_THRESHOLD) {
                "WARNING"
            } else if (canister.lastBalance < HEALTHY_THRESHOLD) {
                "CAUTION"
            } else {
                "HEALTHY"
            };
            report #= "  Status: " # status # "\n";

            if (canister.lastTopUpTime > 0) {
                let hoursSince = (Time.now() - canister.lastTopUpTime) / 3_600_000_000_000;
                report #= "  Last Top-Up: " # hoursSince.toText() # " hours ago\n";
            };

            report #= "  Total Received: " # formatCycles(canister.totalCyclesReceived) # "\n";

            if (canister.lastBalance > 0) {
                let estimatedDays = canister.lastBalance / 1_100_000_000_000;
                report #= "  Days Remaining: ~" # estimatedDays.toText() # "\n";
            };
        };

        report #= "\n========================================\n";

        report
    };

    // ===== UTILITY FUNCTIONS =====

    private func formatCycles(cycles: Nat) : Text {
        let inTrillions = cycles / 1_000_000_000_000;
        let remainder = cycles % 1_000_000_000_000;
        let inBillions = remainder / 1_000_000_000;

        inTrillions.toText() # "." #
        (inBillions / 100).toText() # "T cycles"
    };

    public query func getRegistryInfo() : async [CanisterInfo] {
        canisterRegistry
    };

    public query func getStats() : async {
        masterBalance: Nat;
        totalTopUps: Nat;
        totalCyclesDistributed: Nat;
        canisterCount: Nat;
    } {
        {
            masterBalance;
            totalTopUps;
            totalCyclesDistributed;
            canisterCount = canisterRegistry.size();
        }
    };

    system func preupgrade() {
        Debug.print("Deep Thought upgrading...");
    };

    system func postupgrade() {
        Debug.print("Deep Thought restored");
    };
};
