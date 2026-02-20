import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SensoryCortexInterface {
    askAgent(arg0: string): Promise<string>;
}
export interface FileMetadata {
    assignedAgent: string;
    size: bigint;
    filename: string;
}
export interface Agent {
    id: bigint;
    name: string;
    isEnabled: boolean;
}
export interface DebateState {
    isDebating: boolean;
    emergencyMode: boolean;
    transcript: string;
    currentSpeaker: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    abortDebate(userInterruption: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAgentRegistry(): Promise<Array<Agent>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFileRegistry(): Promise<Array<[string, FileMetadata]>>;
    getStatus(): Promise<DebateState>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAgents(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    routeDocument(filename: string, filePreview: string, fileSize: bigint, sensoryCortex: Principal): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startBoardroomDebate(userPrompt: string, _skippy: Principal, _glados: Principal, _robby: Principal): Promise<void>;
    toggleAgentStatus(agentName: string, status: boolean): Promise<void>;
    topUpSwarm(targetCanister: Principal, amount: bigint): Promise<void>;
}
