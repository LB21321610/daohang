export type BrowserStorageKind = "localStorage" | "sessionStorage";

// Accessing window.localStorage itself throws when the browser blocks site data.
export function getBrowserStorage(kind: BrowserStorageKind): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window[kind];
  } catch {
    return null;
  }
}

export function readStorageItem(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorageItem(storage: Storage | null, key: string, value: string): boolean {
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
