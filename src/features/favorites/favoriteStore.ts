export const FAVORITES_STORAGE_KEY = "personal-nav:favorites:v1";

export function readFavoriteIds(storage: Storage): string[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];

    return [...new Set(value.filter((item): item is string => typeof item === "string"))];
  } catch {
    return [];
  }
}

export function toggleFavorite(storage: Storage, siteId: string): string[] {
  const current = readFavoriteIds(storage);
  const next = current.includes(siteId)
    ? current.filter((favoriteId) => favoriteId !== siteId)
    : [...current, siteId];

  storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  return next;
}
