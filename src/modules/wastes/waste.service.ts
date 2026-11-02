import { eq, desc } from "drizzle-orm";
import { db } from "../../db/connection";
import { wastes } from "../../db/schema";

export type Waste = typeof wastes.$inferSelect;
export type NewWaste = typeof wastes.$inferInsert;

export class WasteService {
  static async createWaste(data: NewWaste): Promise<Waste> {
    const [createdWaste] = await db.insert(wastes).values(data).returning();
    if (!createdWaste) {
      throw new Error("Failed to record waste data.");
    }
    return createdWaste;
  }

  static async getAllWastes(): Promise<Waste[]> {
    return await db.select().from(wastes).orderBy(desc(wastes.createdAt));
  }

  static async getWasteById(id: number): Promise<Waste | null> {
    const [waste] = await db
      .select()
      .from(wastes)
      .where(eq(wastes.id, id))
      .limit(1);

    return waste ?? null;
  }
}
