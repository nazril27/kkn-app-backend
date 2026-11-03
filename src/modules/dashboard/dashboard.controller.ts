import { Elysia, t } from "elysia";
import { toErrorResponse } from "../../lib/errors";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  static async getSummary({
    query,
    set,
  }: {
    query: { rt?: string };
    set: { status?: number | string };
  }) {
    try {
      const data = await DashboardService.getSummary(query.rt);
      return {
        success: true,
        message: "Dashboard summary retrieved successfully",
        data,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to retrieve dashboard summary",
        500
      );
      set.status = status;
      return response;
    }
  }
}

export const dashboardController = new Elysia({ prefix: "/dashboard" }).get(
  "/",
  async ({ query, set }) => DashboardController.getSummary({ query, set }),
  {
    query: t.Object({
      rt: t.Optional(t.String({ minLength: 1, maxLength: 5 })),
    }),
  }
);
