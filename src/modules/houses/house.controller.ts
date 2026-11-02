import { Elysia, t } from "elysia";
import { HouseService } from "./house.service";

export class HouseController {
  static async create({
    body,
    set,
  }: {
    body: {
      rt: string;
      headOfFamilyName: string;
      numberOfFamilyMembers: string | number;
      isSortingWaste: string;
      streetName?: string | null;
      houseNumber?: string | number | null;
      userId?: number | null;
    };
    set: { status?: number | string };
  }) {
    try {
      const house = await HouseService.createHouse({
        rt: body.rt,
        headOfFamilyName: body.headOfFamilyName,
        numberOfFamilyMembers: String(body.numberOfFamilyMembers),
        isSortingWaste: body.isSortingWaste,
        streetName: body.streetName ?? null,
        houseNumber: body.houseNumber != null ? String(body.houseNumber) : null,
        userId: body.userId ?? null,
      });

      set.status = 201;
      return {
        success: true,
        message: "House created successfully",
        data: house,
      };
    } catch (error: any) {
      set.status = 400;
      return {
        success: false,
        message: error.message || "Failed to create house",
      };
    }
  }

  static async getAll({ set }: { set: { status?: number | string } }) {
    try {
      const houseList = await HouseService.getAllHouses();
      return {
        success: true,
        message: "Houses retrieved successfully",
        data: houseList,
      };
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        message: error.message || "Failed to retrieve houses",
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
      const house = await HouseService.getHouseById(id);
      if (!house) {
        set.status = 404;
        return {
          success: false,
          message: `House with ID ${id} not found`,
        };
      }

      return {
        success: true,
        message: "House retrieved successfully",
        data: house,
      };
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        message: error.message || "Failed to retrieve house",
      };
    }
  }
}

export const houseController = new Elysia({ prefix: "/houses" })
  .post(
    "/",
    async ({ body, set }) => HouseController.create({ body, set }),
    {
      body: t.Object({
        rt: t.String({ minLength: 1 }),
        headOfFamilyName: t.String({ minLength: 1 }),
        numberOfFamilyMembers: t.Union([t.String(), t.Number()]),
        isSortingWaste: t.String({ minLength: 1 }),
        streetName: t.Optional(t.Nullable(t.String())),
        houseNumber: t.Optional(t.Nullable(t.Union([t.String(), t.Number()]))),
        userId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )
  .get("/", async ({ set }) => HouseController.getAll({ set }))
  .get(
    "/:id",
    async ({ params, set }) => HouseController.getById({ params: { id: params.id }, set }),
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  );
