export function nullIfMissing<T extends { id: number | null }>(
  value: T | null | undefined
): T | null {
  if (!value || value.id == null) {
    return null;
  }
  return value;
}
