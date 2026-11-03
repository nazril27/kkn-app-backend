import { t } from "elysia";

export const wasteTypeSchema = t.Union([
  t.Literal("organik"),
  t.Literal("nonorganik"),
  t.Literal("residu"),
  t.Literal("lainnya"),
]);

export const sortingWasteSchema = t.Union([
  t.Literal("ya"),
  t.Literal("tidak"),
  t.Literal("sebagian"),
]);

export const paginationQuerySchema = t.Object({
  page: t.Optional(t.Numeric()),
  pageSize: t.Optional(t.Numeric()),
});

export const idParamSchema = t.Object({
  id: t.Numeric({ minimum: 1 }),
});
