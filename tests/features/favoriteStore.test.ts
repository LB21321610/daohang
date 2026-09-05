import { beforeEach, describe, expect, it } from "vitest";

import {
  FAVORITES_STORAGE_KEY,
  readFavoriteIds,
  toggleFavorite,
} from "../../src/features/favorites/favoriteStore";

describe("favoriteStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("recovers from malformed storage data", () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, "not-json");

    expect(readFavoriteIds(localStorage)).toEqual([]);
  });

  it("adds and removes a favorite while persisting the result", () => {
    expect(toggleFavorite(localStorage, "github")).toEqual(["github"]);
    expect(readFavoriteIds(localStorage)).toEqual(["github"]);

    expect(toggleFavorite(localStorage, "github")).toEqual([]);
    expect(readFavoriteIds(localStorage)).toEqual([]);
  });
});
