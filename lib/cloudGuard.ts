/**
 * Cloud write guards — localStorage is a cache, never allowed to wipe the
 * signed-in account's saved programme / history / progress.
 */

/** Keep existing server rows when the client tries to save an empty collection. */
export function keepExistingIfIncomingEmpty<T>(
  incoming: T[] | null | undefined,
  existing: T[] | null | undefined,
  allowEmpty: boolean,
): T[] {
  const next = Array.isArray(incoming) ? incoming : [];
  const prior = Array.isArray(existing) ? existing : [];
  if (allowEmpty) return next;
  if (next.length === 0 && prior.length > 0) return prior;
  return next;
}

export function mergeById<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of [...cloud, ...local]) {
    if (!item?.id) continue;
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

export function mergeByIdPreferNewer<T extends { id: string; date?: string }>(
  local: T[],
  cloud: T[],
): T[] {
  const byId = new Map<string, T>();
  const prefer = (a: T, b: T): T => {
    const aDate = a.date ?? "";
    const bDate = b.date ?? "";
    return aDate >= bDate ? a : b;
  };
  for (const item of [...cloud, ...local]) {
    if (!item?.id) continue;
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? prefer(existing, item) : item);
  }
  return Array.from(byId.values());
}

export function cloudLooksEmpty(input: {
  history?: unknown[] | null;
  workouts?: unknown[] | null;
  progress?: unknown[] | null;
  sessionDraft?: unknown;
}): boolean {
  return (
    !(input.history && input.history.length) &&
    !(input.workouts && input.workouts.length) &&
    !(input.progress && input.progress.length) &&
    !input.sessionDraft
  );
}
