export interface PlantyContextData {
  userId: string;
  currentPersonality: string;
  userProfile: {
    name: string;
    characteristics?: string[];
    preferredTone?: string;
    experience?: string;
  } | null;
  conversationHistory: string[];
  godReferences: Record<string, number>;
  createdAt: string;
  lastUpdated: string;
}

export interface PlantyContextRepository {
  getByUserId(userId: string): Promise<PlantyContextData | null>;
  save(context: PlantyContextData): Promise<void>;
  delete(userId: string): Promise<void>;
  exists(userId: string): Promise<boolean>;
}
