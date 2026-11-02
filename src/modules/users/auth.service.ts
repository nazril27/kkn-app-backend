import bcrypt from "bcryptjs";
import { UserService, type UserWithoutPassword } from "./user.service";

export interface RegisterDTO {
  name: string;
  nim: string;
  password: string;
  email?: string | null;
}

export interface LoginDTO {
  identifier?: string;
  email?: string;
  nim?: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterDTO): Promise<UserWithoutPassword> {
    const { name, nim, email, password } = data;

    if (!name || !nim || !password) {
      throw new Error("Name, NIM, and password are required.");
    }

    const existingNim = await UserService.findByNim(nim);
    if (existingNim) {
      throw new Error(`User with NIM "${nim}" already exists.`);
    }

    if (email) {
      const existingEmail = await UserService.findByEmail(email);
      if (existingEmail) {
        throw new Error(`User with email "${email}" already exists.`);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserService.createUser({
      name,
      nim,
      email: email || null,
      password: hashedPassword,
    });

    return UserService.excludePassword(newUser);
  }

  static async login(data: LoginDTO): Promise<UserWithoutPassword> {
    const identifier = data.identifier || data.email || data.nim;

    if (!identifier) {
      throw new Error("Email or NIM is required for login.");
    }

    if (!data.password) {
      throw new Error("Password is required for login.");
    }

    const user = await UserService.findByEmailOrNim(identifier);
    if (!user) {
      throw new Error("Invalid email/NIM or password.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email/NIM or password.");
    }

    return UserService.excludePassword(user);
  }
}
