export interface CompatibilityEntry {
  plant1: string;
  plant2: string;
  score: number;
}

export interface CompatibilityMatrixRepository {
  getCompatibility(plant1: string, plant2: string): Promise<number>;
  getAllCompatibilities(): Promise<Map<string, Map<string, number>>>;
  count(): Promise<number>;
  createMany(entries: CompatibilityEntry[]): Promise<void>;
}
