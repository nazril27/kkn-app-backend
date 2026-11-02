import { eq, or } from "drizzle-orm";
import { db } from "../../db/connection";
import { users } from "../../db/schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserWithoutPassword = Omit<User, "password">;

export class UserService {
  static async createUser(data: NewUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(data).returning();
    if (!createdUser) {
      throw new Error("Failed to create user.");
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

  static async findAll(): Promise<User[]> {
    return await db.select().from(users);
  }

  static excludePassword(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
