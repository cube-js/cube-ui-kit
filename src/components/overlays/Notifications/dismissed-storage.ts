import type { Key } from 'react';

const STORAGE_KEY = 'cube-ui-dismissed-notifications';
const TTL_MS = 86_400_000; // 24 hours

type DismissedMap = Record<string, number>;

function readMap(): DismissedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    return JSON.parse(raw) as DismissedMap;
  } catch {
    return {};
  }
}

function writeMap(map: DismissedMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // SSR, private browsing, or quota exceeded — silently ignore
  }
}

export function saveDismissedId(id: Key): void {
  const map = readMap();

  map[String(id)] = Date.now();
  writeMap(map);
}

/**
 * Reads the dismissed-IDs map from localStorage, removes entries older than
 * 24 hours, writes the cleaned map back, and returns the remaining valid IDs.
 */
export function cleanupAndGetValidIds(): Set<string> {
  const map = readMap();
  const now = Date.now();
  const validIds = new Set<string>();
  let changed = false;

  for (const [id, timestamp] of Object.entries(map)) {
    if (now - timestamp > TTL_MS) {
      delete map[id];
      changed = true;
    } else {
      validIds.add(id);
    }
  }

  if (changed) {
    writeMap(map);
  }

  return validIds;
}
