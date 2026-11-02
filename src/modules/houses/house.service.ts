import { eq, desc } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses } from "../../db/schema";

export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;

export class HouseService {
  static async createHouse(data: NewHouse): Promise<House> {
    const [createdHouse] = await db.insert(houses).values(data).returning();
    if (!createdHouse) {
      throw new Error("Failed to create house.");
    }
    return createdHouse;
  }

  static async getAllHouses(): Promise<House[]> {
    return await db.select().from(houses).orderBy(desc(houses.createdAt));
  }

  static async getHouseById(id: number): Promise<House | null> {
    const [house] = await db
      .select()
      .from(houses)
      .where(eq(houses.id, id))
      .limit(1);

    return house ?? null;
  }
}
