import { Elysia } from 'elysia';
import { toErrorResponse } from "../../lib/errors";
import { UserService } from './user.service';

export class UserController {
  static async getAll({
    set,
  }: {
    set: { status?: number | string };
  }) {
    try {
      const data = await UserService.findAll();
      return {
        success: true,
        message: "Users retrieved successfully",
        data,
        total: data.length,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to retrieve users",
        500
      );
      set.status = status;
      return response;
    }
  }
}

export const userController = new Elysia({ prefix: "/users" })
  .get("/", UserController.getAll);