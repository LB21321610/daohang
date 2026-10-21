import { readStorageItem, writeStorageItem } from "../storage/browserStorage";

export const FAVORITES_STORAGE_KEY = "personal-nav:favorites:v1";

export interface FavoriteToggleResult {
  ids: string[];
  persisted: boolean;
}

export function readFavoriteIds(storage: Storage | null): string[] {
  try {
    const value: unknown = JSON.parse(readStorageItem(storage, FAVORITES_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];

    return [...new Set(value.filter((item): item is string => typeof item === "string"))];
  } catch {
    return [];
  }
}

// Without usable storage, fallbackIds (the in-memory list) is the source of truth.
export function toggleFavorite(
  storage: Storage | null,
  siteId: string,
  fallbackIds: string[] = [],
): FavoriteToggleResult {
  const current = storage ? readFavoriteIds(storage) : fallbackIds;
  const ids = current.includes(siteId)
    ? current.filter((favoriteId) => favoriteId !== siteId)
    : [...current, siteId];

  return { ids, persisted: writeStorageItem(storage, FAVORITES_STORAGE_KEY, JSON.stringify(ids)) };
}
