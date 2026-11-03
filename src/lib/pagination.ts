export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function normalizePagination(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const currentPage = toPositiveInt(page, 1);
  const limit = Math.min(MAX_PAGE_SIZE, toPositiveInt(pageSize, DEFAULT_PAGE_SIZE));
  const offset = (currentPage - 1) * limit;

  return { currentPage, limit, offset };
}
