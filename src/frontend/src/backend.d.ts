import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FileMetadata {
    assignedAgent: string;
    size: bigint;
    filename: string;
}
export interface DebateState {
    isDebating: boolean;
    emergencyMode: boolean;
    transcript: string;
    currentSpeaker: string;
}
export interface Agent {
    id: bigint;
    name: string;
    lastCycles?: bigint;
    agentType?: AgentType;
    isEnabled: boolean;
    principalId?: string;
}
export interface UserProfile {
    name: string;
}
export enum AgentType {
    cybersecurityToolbox = "cybersecurityToolbox",
    dataAnalysis = "dataAnalysis",
    documentRouting = "documentRouting",
    decisionMaking = "decisionMaking",
    generalPurpose = "generalPurpose",
    archiveManagement = "archiveManagement",
    contentGeneration = "contentGeneration",
    researchLibrary = "researchLibrary",
    fileOcrSystem = "fileOcrSystem",
    mathLawAI = "mathLawAI"
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
    routeDocument(filename: string, filePreview: string, fileSize: bigint): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    start_boardroom_debate(prompt: string): Promise<string>;
    toggleAgentStatus(agentName: string, status: boolean): Promise<void>;
    topUpSwarm(targetCanister: Principal, amount: bigint): Promise<void>;
}
