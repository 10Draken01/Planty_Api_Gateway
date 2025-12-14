import { PlantyContextRepository, PlantyContextData } from '../../domain/repositories/PlantyContextRepository';
import { PlantyContextModel } from '../database/models/PlantyContextModel';

export class MongoPlantyContextRepository implements PlantyContextRepository {
  async getByUserId(userId: string): Promise<PlantyContextData | null> {
    const doc = await PlantyContextModel.findOne({ userId });
    if (!doc) return null;

    return {
      userId: doc.userId,
      currentPersonality: doc.currentPersonality,
      userProfile: doc.userProfile,
      conversationHistory: doc.conversationHistory,
      godReferences: Object.fromEntries(doc.godReferences || new Map()),
      createdAt: doc.createdAt.toISOString(),
      lastUpdated: doc.updatedAt.toISOString()
    };
  }

  async save(context: PlantyContextData): Promise<void> {
    const godRefsMap = new Map(Object.entries(context.godReferences || {}));

    await PlantyContextModel.findOneAndUpdate(
      { userId: context.userId },
      {
        userId: context.userId,
        currentPersonality: context.currentPersonality,
        userProfile: context.userProfile,
        conversationHistory: context.conversationHistory,
        godReferences: godRefsMap
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  async delete(userId: string): Promise<void> {
    await PlantyContextModel.deleteOne({ userId });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await PlantyContextModel.countDocuments({ userId });
    return count > 0;
  }
}
