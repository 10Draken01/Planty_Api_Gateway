/**
 * Entidad PlantyContext - Contexto persistente de Planty por usuario
 */

import { PersonalityType } from './Personality';

export interface UserProfile {
  name: string;
  characteristics?: string[];
  preferredTone?: string;
  experience?: string;
}

export class PlantyContext {
  private constructor(
    public readonly userId: string,
    public readonly currentPersonality: PersonalityType,
    public readonly userProfile: UserProfile | null,
    public readonly conversationHistory: string[],
    public readonly godReferences: Map<string, number>,
    public readonly createdAt: Date,
    public readonly lastUpdated: Date
  ) {}

  static createNew(userId: string): PlantyContext {
    return new PlantyContext(
      userId,
      'amigable',
      null,
      [],
      new Map(),
      new Date(),
      new Date()
    );
  }

  static fromPersistence(data: any): PlantyContext {
    return new PlantyContext(
      data.userId,
      data.currentPersonality || 'amigable',
      data.userProfile || null,
      data.conversationHistory || [],
      new Map(Object.entries(data.godReferences || {})),
      new Date(data.createdAt),
      new Date(data.lastUpdated)
    );
  }

  changePersonality(newPersonality: PersonalityType): PlantyContext {
    return new PlantyContext(
      this.userId,
      newPersonality,
      this.userProfile,
      this.conversationHistory,
      this.godReferences,
      this.createdAt,
      new Date()
    );
  }

  setUserProfile(profile: UserProfile): PlantyContext {
    return new PlantyContext(
      this.userId,
      this.currentPersonality,
      profile,
      this.conversationHistory,
      this.godReferences,
      this.createdAt,
      new Date()
    );
  }

  addConversationMemory(memory: string): PlantyContext {
    const newHistory = [...this.conversationHistory, memory];
    if (newHistory.length > 10) {
      newHistory.shift();
    }

    return new PlantyContext(
      this.userId,
      this.currentPersonality,
      this.userProfile,
      newHistory,
      this.godReferences,
      this.createdAt,
      new Date()
    );
  }

  incrementGodReference(godName: string): PlantyContext {
    const newRefs = new Map(this.godReferences);
    newRefs.set(godName, (newRefs.get(godName) || 0) + 1);

    return new PlantyContext(
      this.userId,
      this.currentPersonality,
      this.userProfile,
      this.conversationHistory,
      newRefs,
      this.createdAt,
      new Date()
    );
  }

  needsUserProfile(): boolean {
    return this.userProfile === null;
  }

  hasUserProfile(): boolean {
    return this.userProfile !== null;
  }

  toPersistence() {
    return {
      userId: this.userId,
      currentPersonality: this.currentPersonality,
      userProfile: this.userProfile,
      conversationHistory: this.conversationHistory,
      godReferences: Object.fromEntries(this.godReferences),
      createdAt: this.createdAt.toISOString(),
      lastUpdated: this.lastUpdated.toISOString()
    };
  }
}
