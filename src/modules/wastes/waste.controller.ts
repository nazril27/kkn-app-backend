import { Elysia, t } from "elysia";
import { WasteService } from "./waste.service";

export class WasteController {
  static async create({
    body,
    set,
  }: {
    body: {
      weight: string | number;
      typesOfWaste: string;
      houseId?: number | null;
      userId?: number | null;
    };
    set: { status?: number | string };
  }) {
    try {
      const waste = await WasteService.createWaste({
        weight: String(body.weight),
        typesOfWaste: body.typesOfWaste,
        houseId: body.houseId ?? null,
        userId: body.userId ?? null,
      });

      set.status = 201;
      return {
        success: true,
        message: "Waste record created successfully",
        data: waste,
      };
    } catch (error: any) {
      set.status = 400;
      return {
        success: false,
        message: error.message || "Failed to create waste record",
      };
    }
  }

  static async getAll({ set }: { set: { status?: number | string } }) {
    try {
      const wasteList = await WasteService.getAllWastes();
      return {
        success: true,
        message: "Waste records retrieved successfully",
        data: wasteList,
      };
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        message: error.message || "Failed to retrieve waste records",
      };
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
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        message: error.message || "Failed to retrieve waste record",
      };
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
        typesOfWaste: t.String({ minLength: 1 }),
        houseId: t.Optional(t.Nullable(t.Number())),
        userId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )
  .get("/", async ({ set }) => WasteController.getAll({ set }))
  .get(
    "/:id",
    async ({ params, set }) => WasteController.getById({ params: { id: params.id }, set }),
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  );
