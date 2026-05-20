/** Normalize UUID strings for reliable comparison (backend vs STOMP payloads). */
export function normalizeId(id: string | null | undefined): string {
  if (id == null) return '';
  return String(id).trim().toLowerCase();
}

export function idsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeId(a) === normalizeId(b);
}
