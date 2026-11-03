import { AppError } from "./errors";

export function normalizeFamilyMembers(value: string | number): string {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError("numberOfFamilyMembers must be a positive integer", 400);
  }
  return String(parsed);
}

export function normalizeWeight(value: string | number): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError("weight must be a non-negative number", 400);
  }
  return String(parsed);
}

export function normalizeOptionalString(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizeHouseNumber(value: string | number | null | undefined) {
  if (value == null) return null;
  const houseNumber = String(value).trim();
  if (houseNumber.length === 0) return null;
  if (houseNumber.length > 5) {
    throw new AppError("houseNumber must be at most 5 characters", 400);
  }
  return houseNumber;
}
