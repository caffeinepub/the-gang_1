// Deep_Thought.mo - The Accountant
// Standalone canister for cycle management and fiscal reporting

import Cycles "mo:base/ExperimentalCycles";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Error "mo:base/Error";

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

    private stable var masterBalance: Nat = 0;
    private stable var canisterRegistry: [CanisterInfo] = [];
    private stable var totalTopUps: Nat = 0;
    private stable var totalCyclesDistributed: Nat = 0;

    // ===== CONSTANTS =====

    private let CRITICAL_THRESHOLD: Nat = 2_000_000_000_000; // 2T cycles
    private let TOP_UP_AMOUNT: Nat = 3_000_000_000_000; // 3T cycles
    private let WARNING_THRESHOLD: Nat = 5_000_000_000_000; // 5T cycles
    private let HEALTHY_THRESHOLD: Nat = 10_000_000_000_000; // 10T cycles

    // ===== INITIALIZATION =====

    public shared func initializeRegistry(agents: [(Text, Principal)]) : async Text {
        let now = Time.now();
        canisterRegistry := Array.map<(Text, Principal), CanisterInfo>(
            agents,
            func(agent) : CanisterInfo {
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
        "Registry initialized with " # Nat.toText(Array.size(canisterRegistry)) # " canisters"
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
            Cycles.add<system>(amount);
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
            let canisterActor = actor(Principal.toText(canister.principal)): actor {
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

                results := Array.append(results, [(canister.name, balance, status)]);

                canisterRegistry := Array.map<CanisterInfo, CanisterInfo>(
                    canisterRegistry,
                    func(c) : CanisterInfo {
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

            } catch (e) {
                Debug.print("Error checking " # canister.name);
                results := Array.append(results, [(canister.name, 0, "ERROR")]);
            };
        };

        results
    };

    // ===== AUTO TOP-UP FUNCTION =====

    public shared func autoTopUp() : async [(Text, Bool, Text)] {
        var results: [(Text, Bool, Text)] = [];
        let now = Time.now();

        for (canister in canisterRegistry.vals()) {
            let canisterActor = actor(Principal.toText(canister.principal)): actor {
                wallet_balance: () -> async Nat;
                wallet_receive: () -> async Nat;
            };

            try {
                let balance = await canisterActor.wallet_balance();

                if (balance < CRITICAL_THRESHOLD) {
                    if (masterBalance >= TOP_UP_AMOUNT) {
                        Cycles.add<system>(TOP_UP_AMOUNT);
                        let accepted = await canisterActor.wallet_receive();

                        masterBalance -= TOP_UP_AMOUNT;
                        totalTopUps += 1;
                        totalCyclesDistributed += TOP_UP_AMOUNT;

                        canisterRegistry := Array.map<CanisterInfo, CanisterInfo>(
                            canisterRegistry,
                            func(c) : CanisterInfo {
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

                        results := Array.append(results, [
                            (canister.name, true, "Topped up with " # formatCycles(accepted))
                        ]);
                    } else {
                        results := Array.append(results, [
                            (canister.name, false, "Insufficient master balance")
                        ]);
                    }
                } else {
                    results := Array.append(results, [
                        (canister.name, false, "Balance healthy")
                    ]);
                }

            } catch (e) {
                results := Array.append(results, [
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
        report #= "Total Top-Ups: " # Nat.toText(totalTopUps) # "\n";
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
                report #= "  Last Top-Up: " # Int.toText(hoursSince) # " hours ago\n";
            };

            report #= "  Total Received: " # formatCycles(canister.totalCyclesReceived) # "\n";

            if (canister.lastBalance > 0) {
                let estimatedDays = canister.lastBalance / 1_100_000_000_000;
                report #= "  Days Remaining: ~" # Nat.toText(estimatedDays) # "\n";
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

        Nat.toText(inTrillions) # "." #
        Nat.toText(inBillions / 100) # "T cycles"
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
            canisterCount = Array.size(canisterRegistry);
        }
    };

    system func preupgrade() {
        Debug.print("Deep Thought upgrading...");
    };

    system func postupgrade() {
        Debug.print("Deep Thought restored");
    };
};
