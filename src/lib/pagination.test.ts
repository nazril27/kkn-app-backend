import { expect, test } from "bun:test";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, normalizePagination } from "./pagination";
import { nullIfMissing } from "./relations";
import {
  normalizeFamilyMembers,
  normalizeHouseNumber,
  normalizeOptionalString,
  normalizeWeight,
} from "./validate";
import { AppError } from "./errors";

test("normalizePagination clamps page and pageSize", () => {
  expect(normalizePagination(0, 0)).toEqual({
    currentPage: 1,
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
  });
  expect(normalizePagination(-2, 500).limit).toBe(MAX_PAGE_SIZE);
  expect(normalizePagination(3, 10)).toEqual({
    currentPage: 3,
    limit: 10,
    offset: 20,
  });
  expect(normalizePagination(undefined as unknown as number, undefined as unknown as number).limit).toBe(
    DEFAULT_PAGE_SIZE
  );
});

test("nullIfMissing turns nested join shells into null", () => {
  expect(nullIfMissing({ id: null, name: null })).toBeNull();
  expect(nullIfMissing(null)).toBeNull();
  expect(nullIfMissing({ id: 1, name: "A" })).toEqual({ id: 1, name: "A" });
});

test("normalizeFamilyMembers rejects invalid values", () => {
  expect(normalizeFamilyMembers("4")).toBe("4");
  expect(() => normalizeFamilyMembers("0")).toThrow(AppError);
  expect(() => normalizeFamilyMembers("1.5")).toThrow(AppError);
});

test("normalizeWeight rejects negative values", () => {
  expect(normalizeWeight(2.5)).toBe("2.5");
  expect(normalizeWeight("0")).toBe("0");
  expect(() => normalizeWeight(-1)).toThrow(AppError);
  expect(() => normalizeWeight("abc")).toThrow(AppError);
});

test("normalizeOptionalString trims empty values to null", () => {
  expect(normalizeOptionalString("  gang a  ")).toBe("gang a");
  expect(normalizeOptionalString("   ")).toBeNull();
  expect(normalizeOptionalString(null)).toBeNull();
});

test("normalizeHouseNumber rejects values longer than 5 characters", () => {
  expect(normalizeHouseNumber(12)).toBe("12");
  expect(normalizeHouseNumber("  ")).toBeNull();
  expect(() => normalizeHouseNumber("123456")).toThrow(AppError);
});
