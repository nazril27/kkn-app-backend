import { count, desc, eq, and, ilike, or, SQL } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses, users, wastes } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { normalizePagination } from "../../lib/pagination";
import { nullIfMissing } from "../../lib/relations";
import { UserService } from "../users/user.service";
import { uploadImage, deleteImage } from "../../lib/cloudinary";

export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;

export interface HouseFilters {
  search?: string;          // cari di nama kepala keluarga / jalan / no rumah
  rt?: string;
  isSortingWaste?: string;  // "ya" | "tidak" | "sebagian"
  userId?: number;
}

const houseSelect = {
  id: houses.id,
  streetName: houses.streetName,
  houseNumber: houses.houseNumber,
  rt: houses.rt,
  headOfFamilyName: houses.headOfFamilyName,
  numberOfFamilyMembers: houses.numberOfFamilyMembers,
  isSortingWaste: houses.isSortingWaste,
  imageUrl: houses.imageUrl,
  imagePublicId: houses.imagePublicId,
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

  static async createHouse(data: NewHouse, file?: File) {
    await this.ensureUserExists(data.userId);
    const [createdHouse] = await db.insert(houses).values(data).returning();
    if (!createdHouse) {
      throw new AppError("Failed to create house.", 500);
    }

    if (file) {
      let uploadedImage: { secure_url: string; public_id: string } | null = null;
      try {
        uploadedImage = await uploadImage(file, `houses/${createdHouse.id}`);
        await db
          .update(houses)
          .set({
            imageUrl: uploadedImage.secure_url,
            imagePublicId: uploadedImage.public_id,
          })
          .where(eq(houses.id, createdHouse.id));
      } catch (uploadError) {
        // Rollback: hapus data rumah yang sudah dibuat dan bersihkan aset cloudinary jika ada
        await db.delete(houses).where(eq(houses.id, createdHouse.id)).catch(console.error);
        if (uploadedImage?.public_id) {
          await deleteImage(uploadedImage.public_id).catch(console.error);
        }
        throw new AppError("Failed to upload house image", 500);
      }
    }

    const house = await this.getHouseById(createdHouse.id);
    if (!house) {
      throw new AppError("Failed to create house.", 500);
    }
    return house;
  }

  static async getAllHouses(
    page: number = 1,
    pageSize: number = 10,
    filters: HouseFilters = {}
  ) {
    const { currentPage, limit, offset } = normalizePagination(page, pageSize);

    // Bangun kondisi filter secara dinamis
    const conditions: (SQL | undefined)[] = [];

    if (filters.search) {
      const keyword = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(houses.headOfFamilyName, keyword),
          ilike(houses.streetName, keyword),
          ilike(houses.houseNumber, keyword)
        )
      );
    }
    if (filters.rt) conditions.push(eq(houses.rt, filters.rt));
    if (filters.isSortingWaste)
      conditions.push(eq(houses.isSortingWaste, filters.isSortingWaste));
    if (filters.userId !== undefined)
      conditions.push(eq(houses.userId, filters.userId));

    const where = and(...conditions); // undefined jika tidak ada filter

    const [rows, [countResult]] = await Promise.all([
      db
        .select(houseSelect)
        .from(houses)
        .leftJoin(users, eq(houses.userId, users.id))
        .where(where)
        .orderBy(desc(houses.createdAt), desc(houses.id)) // tie-breaker
        .limit(limit)
        .offset(offset),

      // where yang sama dipakai untuk count agar total sesuai filter
      db.select({ count: count(houses.id) }).from(houses).where(where),
    ]);

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

  static async updateHouse(id: number, data: Partial<NewHouse>, file?: File) {
    await this.ensureUserExists(data.userId);

    const [existing] = await db
      .select({ imagePublicId: houses.imagePublicId })
      .from(houses)
      .where(eq(houses.id, id))
      .limit(1);

    if (!existing) {
      return null;
    }

    const oldImagePublicId = existing.imagePublicId;

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

    // Hapus gambar lama jika ada gambar baru atau gambar dikosongkan
    if (
      data.imagePublicId !== undefined &&
      oldImagePublicId &&
      oldImagePublicId !== data.imagePublicId
    ) {
      await deleteImage(oldImagePublicId).catch(console.error);
    }

    if (file) {
      let uploadedImage: { secure_url: string; public_id: string } | null = null;
      try {
        uploadedImage = await uploadImage(file, `houses/${updatedHouse.id}`);
        await db
          .update(houses)
          .set({
            imageUrl: uploadedImage.secure_url,
            imagePublicId: uploadedImage.public_id,
          })
          .where(eq(houses.id, updatedHouse.id));

        // Hapus gambar lama di Cloudinary agar tidak menjadi file sampah (orphan)
        if (oldImagePublicId) {
          await deleteImage(oldImagePublicId).catch(console.error);
        }
      } catch (error) {
        // Bersihkan gambar baru jika update ke database gagal
        if (uploadedImage?.public_id) {
          await deleteImage(uploadedImage.public_id).catch(console.error);
        }
        throw new AppError("Failed to upload house image", 500);
      }
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
      .returning({ id: houses.id, imagePublicId: houses.imagePublicId });

    if (deletedHouse?.imagePublicId) {
      await deleteImage(deletedHouse.imagePublicId).catch(console.error);
    }

    return !!deletedHouse;
  }
}
