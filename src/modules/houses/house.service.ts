import { count, desc, eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses, users, wastes } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { normalizePagination } from "../../lib/pagination";
import { nullIfMissing } from "../../lib/relations";
import { UserService } from "../users/user.service";

export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;

const houseSelect = {
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
};

function mapHouse<T extends { user: { id: number | null } | null }>(
  row: T | null | undefined
) {
  if (!row) return null;
  return {
    ...row,
    user: nullIfMissing(row.user),
  };
}

export class HouseService {
  static async ensureUserExists(userId: number | null | undefined) {
    if (userId == null) return;
    const user = await UserService.findById(userId);
    if (!user) {
      throw new AppError(`User with ID ${userId} not found`, 422);
    }
  }

  static async createHouse(data: NewHouse) {
    await this.ensureUserExists(data.userId);
    const [createdHouse] = await db.insert(houses).values(data).returning();
    if (!createdHouse) {
      throw new AppError("Failed to create house.", 500);
    }
    const house = await this.getHouseById(createdHouse.id);
    if (!house) {
      throw new AppError("Failed to create house.", 500);
    }
    return house;
  }

  static async getAllHouses(page: number = 1, pageSize: number = 10) {
    const { currentPage, limit, offset } = normalizePagination(page, pageSize);

    const rows = await db
      .select(houseSelect)
      .from(houses)
      .leftJoin(users, eq(houses.userId, users.id))
      .orderBy(desc(houses.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count(houses.id) })
      .from(houses);

    const total = countResult ? Number(countResult.count) : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => mapHouse(row)!),
      total,
      page: currentPage,
      pageSize: limit,
      totalPages,
    };
  }

  static async getHouseById(id: number) {
    const [house] = await db
      .select(houseSelect)
      .from(houses)
      .leftJoin(users, eq(houses.userId, users.id))
      .where(eq(houses.id, id))
      .limit(1);

    return mapHouse(house ?? null);
  }

  static async updateHouse(id: number, data: Partial<NewHouse>) {
    await this.ensureUserExists(data.userId);
    const [updatedHouse] = await db
      .update(houses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(houses.id, id))
      .returning();

    if (!updatedHouse) {
      return null;
    }

    return this.getHouseById(id);
  }

  static async deleteHouse(id: number): Promise<boolean> {
    const [wasteRef] = await db
      .select({ id: wastes.id })
      .from(wastes)
      .where(eq(wastes.houseId, id))
      .limit(1);

    if (wasteRef) {
      throw new AppError(
        `Cannot delete house ${id} because waste records still reference it.`,
        409
      );
    }

    const [deletedHouse] = await db
      .delete(houses)
      .where(eq(houses.id, id))
      .returning({ id: houses.id });

    return !!deletedHouse;
  }
}
