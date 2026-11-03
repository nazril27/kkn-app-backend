import { Elysia, t } from "elysia";
import { toErrorResponse } from "../../lib/errors";
import { idParamSchema, paginationQuerySchema, sortingWasteSchema } from "../../lib/http";
import {
  normalizeFamilyMembers,
  normalizeHouseNumber,
  normalizeOptionalString,
} from "../../lib/validate";
import { HouseService, type NewHouse } from "./house.service";

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
        rt: body.rt.trim(),
        headOfFamilyName: body.headOfFamilyName.trim(),
        numberOfFamilyMembers: normalizeFamilyMembers(body.numberOfFamilyMembers),
        isSortingWaste: body.isSortingWaste,
        streetName: normalizeOptionalString(body.streetName),
        houseNumber: normalizeHouseNumber(body.houseNumber),
        userId: body.userId ?? null,
      });

      set.status = 201;
      return {
        success: true,
        message: "House created successfully",
        data: house,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to create house"
      );
      set.status = status;
      return response;
    }
  }

  // static async getAll({
  //   query,
  //   set,
  // }: {
  //   query: { page?: number; pageSize?: number };
  //   set: { status?: number | string };
  // }) {
  //   try {
  //     const result = await HouseService.getAllHouses(query.page, query.pageSize);
  //     return {
  //       success: true,
  //       message: "Houses retrieved successfully",
  //       ...result,
  //     };
  //   } catch (error: unknown) {
  //     const { status, body: response } = toErrorResponse(
  //       error,
  //       "Failed to retrieve houses",
  //       500
  //     );
  //     set.status = status;
  //     return response;
  //   }
  // }

  static async getAll({
    query,
    set,
  }: {
    query: {
      page?: number;
      pageSize?: number;
      search?: string;
      rt?: string;
      isSortingWaste?: string;
      userId?: number;
    };
    set: { status?: number | string };
  }) {
    try {
      const { page, pageSize, ...filters } = query;
      const result = await HouseService.getAllHouses(page, pageSize, filters);
      return {
        success: true,
        message: "Houses retrieved successfully",
        ...result,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to retrieve houses",
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
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to retrieve house",
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
      rt?: string;
      headOfFamilyName?: string;
      numberOfFamilyMembers?: string | number;
      isSortingWaste?: string;
      streetName?: string | null;
      houseNumber?: string | number | null;
      userId?: number | null;
    };
    set: { status?: number | string };
  }) {
    try {
      const existing = await HouseService.getHouseById(id);
      if (!existing) {
        set.status = 404;
        return {
          success: false,
          message: `House with ID ${id} not found`,
        };
      }

      const updateData: Partial<NewHouse> = {};
      if (body.rt !== undefined) updateData.rt = body.rt.trim();
      if (body.headOfFamilyName !== undefined) {
        updateData.headOfFamilyName = body.headOfFamilyName.trim();
      }
      if (body.numberOfFamilyMembers !== undefined) {
        updateData.numberOfFamilyMembers = normalizeFamilyMembers(
          body.numberOfFamilyMembers
        );
      }
      if (body.isSortingWaste !== undefined) {
        updateData.isSortingWaste = body.isSortingWaste;
      }
      if (body.streetName !== undefined) {
        updateData.streetName = normalizeOptionalString(body.streetName);
      }
      if (body.houseNumber !== undefined) {
        updateData.houseNumber = normalizeHouseNumber(body.houseNumber);
      }
      if (body.userId !== undefined) updateData.userId = body.userId;

      const updatedHouse = await HouseService.updateHouse(id, updateData);

      return {
        success: true,
        message: "House updated successfully",
        data: updatedHouse,
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to update house"
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
      const deleted = await HouseService.deleteHouse(id);
      if (!deleted) {
        set.status = 404;
        return {
          success: false,
          message: `House with ID ${id} not found`,
        };
      }

      return {
        success: true,
        message: "House deleted successfully",
      };
    } catch (error: unknown) {
      const { status, body: response } = toErrorResponse(
        error,
        "Failed to delete house"
      );
      set.status = status;
      return response;
    }
  }
}

export const houseController = new Elysia({ prefix: "/houses" })
  .post(
    "/",
    async ({ body, set }) => HouseController.create({ body, set }),
    {
      body: t.Object({
        rt: t.String({ minLength: 1, maxLength: 5 }),
        headOfFamilyName: t.String({ minLength: 1, maxLength: 255 }),
        numberOfFamilyMembers: t.Union([t.String(), t.Number()]),
        isSortingWaste: sortingWasteSchema,
        streetName: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
        houseNumber: t.Optional(t.Nullable(t.Union([t.String({ maxLength: 5 }), t.Number()]))),
        userId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )
  .get(
    "/",
    async ({ query, set }) => HouseController.getAll({ query, set }),
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
        rt: t.Optional(t.String()),
        isSortingWaste: t.Optional(
          t.Union([t.Literal("ya"), t.Literal("tidak"), t.Literal("sebagian")])
        ),
        userId: t.Optional(t.Numeric()),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => HouseController.getById({ params: { id: params.id }, set }),
    {
      params: idParamSchema,
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) =>
      HouseController.update({ params: { id: params.id }, body, set }),
    {
      params: idParamSchema,
      body: t.Object({
        rt: t.Optional(t.String({ minLength: 1, maxLength: 5 })),
        headOfFamilyName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        numberOfFamilyMembers: t.Optional(t.Union([t.String(), t.Number()])),
        isSortingWaste: t.Optional(sortingWasteSchema),
        streetName: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
        houseNumber: t.Optional(t.Nullable(t.Union([t.String({ maxLength: 5 }), t.Number()]))),
        userId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => HouseController.delete({ params: { id: params.id }, set }),
    {
      params: idParamSchema,
    }
  );
