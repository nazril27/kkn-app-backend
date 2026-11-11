import { Elysia, t } from "elysia";
import { toErrorResponse } from "../../lib/errors";
import { idParamSchema, paginationQuerySchema, wasteTypeSchema } from "../../lib/http";
import { normalizeWeight } from "../../lib/validate";
import { WasteService, type NewWaste } from "./waste.service";

export class WasteController {
  static async create({
    body,
    set,
  }: {
    body: {
      weight: string | number;
      typesOfWaste: string;
      note?: string | null;
      houseId?: number | null;
      userId?: number | null;
    };
    set: { status?: number | string };
  }) {
    try {
      const waste = await WasteService.createWaste({
        weight: normalizeWeight(body.weight),
        typesOfWaste: body.typesOfWaste,
        note: body.note ?? null,
        houseId: body.houseId ?? null,
        userId: body.userId ?? null,
      });

      set.status = 201;
      return {
        success: true,
        message: "Waste record created successfully",
        data: waste,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to create waste record"
      );
      set.status = status;
      return response;
    }
  }

  static async getAll({
    query,
    set,
  }: {
    query: { page?: number; pageSize?: number };
    set: { status?: number | string };
  }) {
    try {
      const result = await WasteService.getAllWastes(query.page, query.pageSize);
      return {
        success: true,
        message: "Waste records retrieved successfully",
        ...result,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to retrieve waste records",
        500
      );
      set.status = status;
      return response;
    }
  }

  static async getById({
    params: { id },
    set,
  }: {
    params: { id: number };
    set: { status?: number | string };
  }) {
    try {
      const waste = await WasteService.getWasteById(id);
      if (!waste) {
        set.status = 404;
        return {
          success: false,
          message: `Waste record with ID ${id} not found`,
        };
      }

      return {
        success: true,
        message: "Waste record retrieved successfully",
        data: waste,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to retrieve waste record",
        500
      );
      set.status = status;
      return response;
    }
  }

  static async update({
    params: { id },
    body,
    set,
  }: {
    params: { id: number };
    body: {
      weight?: string | number;
      typesOfWaste?: string;
      note?: string | null;
      houseId?: number | null;
      userId?: number | null;
    };
    set: { status?: number | string };
  }) {
    try {
      const existing = await WasteService.getWasteById(id);
      if (!existing) {
        set.status = 404;
        return {
          success: false,
          message: `Waste record with ID ${id} not found`,
        };
      }

      const updateData: Partial<NewWaste> = {};
      if (body.weight !== undefined) updateData.weight = normalizeWeight(body.weight);
      if (body.typesOfWaste !== undefined) updateData.typesOfWaste = body.typesOfWaste;
      if (body.note !== undefined) updateData.note = body.note; 
      if (body.houseId !== undefined) updateData.houseId = body.houseId;
      if (body.userId !== undefined) updateData.userId = body.userId;

      const updatedWaste = await WasteService.updateWaste(id, updateData);

      return {
        success: true,
        message: "Waste record updated successfully",
        data: updatedWaste,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to update waste record"
      );
      set.status = status;
      return response;
    }
  }

  static async delete({
    params: { id },
    set,
  }: {
    params: { id: number };
    set: { status?: number | string };
  }) {
    try {
      const deleted = await WasteService.deleteWaste(id);
      if (!deleted) {
        set.status = 404;
        return {
          success: false,
          message: `Waste record with ID ${id} not found`,
        };
      }

      return {
        success: true,
        message: "Waste record deleted successfully",
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to delete waste record"
      );
      set.status = status;
      return response;
    }
  }
}

export const wasteController = new Elysia({ prefix: "/wastes" })
  .post(
    "/",
    async ({ body, set }) => WasteController.create({ body, set }),
    {
      body: t.Object({
        weight: t.Union([t.String(), t.Number()]),
        typesOfWaste: wasteTypeSchema,
        note: t.Optional(t.Nullable(t.String())),
        houseId: t.Optional(t.Nullable(t.Number())),
        userId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )
  .get(
    "/",
    async ({ query, set }) => WasteController.getAll({ query, set }),
    {
      query: paginationQuerySchema,
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => WasteController.getById({ params: { id: params.id }, set }),
    {
      params: idParamSchema,
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) =>
      WasteController.update({ params: { id: params.id }, body, set }),
    {
      params: idParamSchema,
      body: t.Object({
        weight: t.Optional(t.Union([t.String(), t.Number()])),
        typesOfWaste: t.Optional(wasteTypeSchema),
        note: t.Optional(t.Nullable(t.String())),
        houseId: t.Optional(t.Nullable(t.Number())),
        userId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => WasteController.delete({ params: { id: params.id }, set }),
    {
      params: idParamSchema,
    }
  );
