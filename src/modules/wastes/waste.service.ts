import { eq, desc } from "drizzle-orm";
import { db } from "../../db/connection";
import { wastes, users, houses } from "../../db/schema";

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

  static async getAllWastes() {
    return await db
      .select({
        id: wastes.id,
        weight: wastes.weight,
        typesOfWaste: wastes.typesOfWaste,
        userId: wastes.userId,
        houseId: wastes.houseId,
        createdAt: wastes.createdAt,
        updatedAt: wastes.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          nim: users.nim,
        },
        house: {
          id: houses.id,
          streetName: houses.streetName,
          houseNumber: houses.houseNumber,
          rt: houses.rt,
          headOfFamilyName: houses.headOfFamilyName,
          numberOfFamilyMembers: houses.numberOfFamilyMembers,
          isSortingWaste: houses.isSortingWaste,
        },
      })
      .from(wastes)
      .leftJoin(users, eq(wastes.userId, users.id))
      .leftJoin(houses, eq(wastes.houseId, houses.id))
      .orderBy(desc(wastes.createdAt));
  }

  static async getWasteById(id: number) {
    const [waste] = await db
      .select({
        id: wastes.id,
        weight: wastes.weight,
        typesOfWaste: wastes.typesOfWaste,
        userId: wastes.userId,
        houseId: wastes.houseId,
        createdAt: wastes.createdAt,
        updatedAt: wastes.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          nim: users.nim,
        },
        house: {
          id: houses.id,
          streetName: houses.streetName,
          houseNumber: houses.houseNumber,
          rt: houses.rt,
          headOfFamilyName: houses.headOfFamilyName,
          numberOfFamilyMembers: houses.numberOfFamilyMembers,
          isSortingWaste: houses.isSortingWaste,
        },
      })
      .from(wastes)
      .leftJoin(users, eq(wastes.userId, users.id))
      .leftJoin(houses, eq(wastes.houseId, houses.id))
      .where(eq(wastes.id, id))
      .limit(1);

    return waste ?? null;
  }
}
