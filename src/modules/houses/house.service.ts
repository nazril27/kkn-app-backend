import { eq, desc } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses, users } from "../../db/schema";

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

  static async getAllHouses() {
    return await db
      .select({
        id: houses.id,
        streetName: houses.streetName,
        houseNumber: houses.houseNumber,
        rt: houses.rt,
        headOfFamilyName: houses.headOfFamilyName,
        numberOfFamilyMembers: houses.numberOfFamilyMembers,
        isSortingWaste: houses.isSortingWaste,
        userId: houses.userId,
        createdAt: houses.createdAt,
        updatedAt: houses.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          nim: users.nim,
        },
      })
      .from(houses)
      .leftJoin(users, eq(houses.userId, users.id))
      .orderBy(desc(houses.createdAt));
  }

  static async getHouseById(id: number) {
    const [house] = await db
      .select({
        id: houses.id,
        streetName: houses.streetName,
        houseNumber: houses.houseNumber,
        rt: houses.rt,
        headOfFamilyName: houses.headOfFamilyName,
        numberOfFamilyMembers: houses.numberOfFamilyMembers,
        isSortingWaste: houses.isSortingWaste,
        userId: houses.userId,
        createdAt: houses.createdAt,
        updatedAt: houses.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          nim: users.nim,
        },
      })
      .from(houses)
      .leftJoin(users, eq(houses.userId, users.id))
      .where(eq(houses.id, id))
      .limit(1);

    return house ?? null;
  }
}
