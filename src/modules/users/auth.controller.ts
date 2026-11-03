import { Elysia, t } from "elysia";
import { toErrorResponse } from "../../lib/errors";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register({
    body,
    set,
  }: {
    body: { name: string; nim: string; password: string; email?: string | null };
    set: { status?: number | string };
  }) {
    try {
      const user = await AuthService.register(body);
      set.status = 201;
      return {
        success: true,
        message: "User registered successfully",
        data: user,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to register user"
      );
      set.status = status;
      return response;
    }
  }

  static async login({
    body,
    set,
  }: {
    body: { identifier?: string; email?: string; nim?: string; password: string };
    set: { status?: number | string };
  }) {
    try {
      const user = await AuthService.login(body);
      set.status = 200;
      return {
        success: true,
        message: "Login successful",
        data: user,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Invalid credentials",
        401
      );
      set.status = status;
      return response;
    }
  }

  static async logout({ set }: { set: { status?: number | string } }) {
    set.status = 200;
    return {
      success: true,
      message: "Logout successful",
    };
  }
}

export const authController = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, set }) => AuthController.register({ body, set }),
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        nim: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
        email: t.Optional(t.Nullable(t.String())),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => AuthController.login({ body, set }),
    {
      body: t.Object({
        identifier: t.Optional(t.String()),
        email: t.Optional(t.String()),
        nim: t.Optional(t.String()),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post("/logout", async ({ set }) => AuthController.logout({ set }));
