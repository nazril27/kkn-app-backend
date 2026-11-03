import { count, desc, eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses, users, wastes } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { normalizePagination } from "../../lib/pagination";
import { nullIfMissing } from "../../lib/relations";
import { HouseService } from "../houses/house.service";
import { UserService } from "../users/user.service";

export type Waste = typeof wastes.$inferSelect;
export type NewWaste = typeof wastes.$inferInsert;

const wasteSelect = {
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
};

function mapWaste<
  T extends {
    user: { id: number | null } | null;
    house: { id: number | null } | null;
  },
>(row: T | null | undefined) {
  if (!row) return null;
  return {
    ...row,
    user: nullIfMissing(row.user),
    house: nullIfMissing(row.house),
  };
}

export class WasteService {
  static async ensureRelationsExist(data: {
    userId?: number | null;
    houseId?: number | null;
  }) {
    if (data.userId != null) {
      const user = await UserService.findById(data.userId);
      if (!user) {
        throw new AppError(`User with ID ${data.userId} not found`, 422);
      }
    }

    if (data.houseId != null) {
      const house = await HouseService.getHouseById(data.houseId);
      if (!house) {
        throw new AppError(`House with ID ${data.houseId} not found`, 422);
      }
    }
  }

  static async createWaste(data: NewWaste) {
    await this.ensureRelationsExist(data);
    const [createdWaste] = await db.insert(wastes).values(data).returning();
    if (!createdWaste) {
      throw new AppError("Failed to record waste data.", 500);
    }
    const waste = await this.getWasteById(createdWaste.id);
    if (!waste) {
      throw new AppError("Failed to record waste data.", 500);
    }
    return waste;
  }

  static async getAllWastes(page: number = 1, pageSize: number = 10) {
    const { currentPage, limit, offset } = normalizePagination(page, pageSize);

    const rows = await db
      .select(wasteSelect)
      .from(wastes)
      .leftJoin(users, eq(wastes.userId, users.id))
      .leftJoin(houses, eq(wastes.houseId, houses.id))
      .orderBy(desc(wastes.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count(wastes.id) })
      .from(wastes);

    const total = countResult ? Number(countResult.count) : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => mapWaste(row)!),
      total,
      page: currentPage,
      pageSize: limit,
      totalPages,
    };
  }

  static async getWasteById(id: number) {
    const [waste] = await db
      .select(wasteSelect)
      .from(wastes)
      .leftJoin(users, eq(wastes.userId, users.id))
      .leftJoin(houses, eq(wastes.houseId, houses.id))
      .where(eq(wastes.id, id))
      .limit(1);

    return mapWaste(waste ?? null);
  }

  static async updateWaste(id: number, data: Partial<NewWaste>) {
    await this.ensureRelationsExist(data);
    const [updatedWaste] = await db
      .update(wastes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(wastes.id, id))
      .returning();

    if (!updatedWaste) {
      return null;
    }

    return this.getWasteById(id);
  }

  static async deleteWaste(id: number): Promise<boolean> {
    const [deletedWaste] = await db
      .delete(wastes)
      .where(eq(wastes.id, id))
      .returning({ id: wastes.id });

    return !!deletedWaste;
  }
}
