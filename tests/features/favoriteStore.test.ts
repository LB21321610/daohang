import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FAVORITES_STORAGE_KEY,
  readFavoriteIds,
  toggleFavorite,
} from "../../src/features/favorites/favoriteStore";

describe("favoriteStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("recovers from malformed storage data", () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, "not-json");

    expect(readFavoriteIds(localStorage)).toEqual([]);
  });

  it("adds and removes a favorite while persisting the result", () => {
    expect(toggleFavorite(localStorage, "github")).toEqual({ ids: ["github"], persisted: true });
    expect(readFavoriteIds(localStorage)).toEqual(["github"]);

    expect(toggleFavorite(localStorage, "github")).toEqual({ ids: [], persisted: true });
    expect(readFavoriteIds(localStorage)).toEqual([]);
  });

  it("toggles the in-memory list when storage is unavailable", () => {
    expect(readFavoriteIds(null)).toEqual([]);
    expect(toggleFavorite(null, "github", ["openai"])).toEqual({ ids: ["openai", "github"], persisted: false });
  });

  it("reports a failed write instead of throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(toggleFavorite(localStorage, "github")).toEqual({ ids: ["github"], persisted: false });
  });
});
