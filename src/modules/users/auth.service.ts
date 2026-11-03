import bcrypt from "bcryptjs";
import { AppError } from "../../lib/errors";
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
      throw new AppError("Name, NIM, and password are required.", 400);
    }

    const existingNim = await UserService.findByNim(nim);
    if (existingNim) {
      throw new AppError(`User with NIM "${nim}" already exists.`, 409);
    }

    if (email) {
      const existingEmail = await UserService.findByEmail(email);
      if (existingEmail) {
        throw new AppError(`User with email "${email}" already exists.`, 409);
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
      throw new AppError("Email or NIM is required for login.", 400);
    }

    if (!data.password) {
      throw new AppError("Password is required for login.", 400);
    }

    const user = await UserService.findByEmailOrNim(identifier);
    if (!user) {
      throw new AppError("Invalid email/NIM or password.", 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email/NIM or password.", 401);
    }

    return UserService.excludePassword(user);
  }
}
