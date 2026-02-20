import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DebateState {
    isDebating: boolean;
    transcript: string;
    currentSpeaker: string;
}
export interface backendInterface {
    abortDebate(userInterruption: string): Promise<void>;
    getStatus(): Promise<DebateState>;
    startBoardroomDebate(userPrompt: string): Promise<void>;
    topUpSwarm(targetCanister: Principal, amount: bigint): Promise<void>;
}
