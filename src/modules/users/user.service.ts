import { count, desc, eq, or } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses, users, wastes } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { normalizePagination } from "../../lib/pagination";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserWithoutPassword = Omit<User, "password">;

const userPublicSelect = {
  id: users.id,
  name: users.name,
  email: users.email,
  nim: users.nim,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export class UserService {
  static async createUser(data: NewUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(data).returning();
    if (!createdUser) {
      throw new AppError("Failed to create user.", 500);
    }
    return createdUser;
  }

  static async findById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  static async findByNim(nim: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.nim, nim))
      .limit(1);

    return user ?? null;
  }

  static async findByEmailOrNim(identifier: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.nim, identifier)))
      .limit(1);

    return user ?? null;
  }

  static async findAll(): Promise<UserWithoutPassword[]> {
    return await db
      .select(userPublicSelect)
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  static async findPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: UserWithoutPassword[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { currentPage, limit, offset } = normalizePagination(page, pageSize);

    const data = await db
      .select(userPublicSelect)
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count(users.id) })
      .from(users);

    const total = countResult ? Number(countResult.count) : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: currentPage,
      pageSize: limit,
      totalPages,
    };
  }

  static async updateUser(id: number, data: Partial<NewUser>): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser ?? null;
  }

  static async deleteUser(id: number): Promise<boolean> {
    const [houseRef] = await db
      .select({ id: houses.id })
      .from(houses)
      .where(eq(houses.userId, id))
      .limit(1);

    const [wasteRef] = await db
      .select({ id: wastes.id })
      .from(wastes)
      .where(eq(wastes.userId, id))
      .limit(1);

    if (houseRef || wasteRef) {
      throw new AppError(
        `Cannot delete user ${id} because houses or waste records still reference it.`,
        409
      );
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return !!deletedUser;
  }

  static excludePassword(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
