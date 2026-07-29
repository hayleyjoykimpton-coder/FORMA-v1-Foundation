/**
 * Home module personalisation — which secondary collapsibles show, and in what order.
 * Local-only (same pattern as reminder prefs); not synced to cloud yet.
 */

export const HOME_PREFS_KEY = "forma-home-prefs-v1";

export type HomeModuleId = "fuel" | "habits" | "programme" | "reflect";

export type HomeModulePref = {
  id: HomeModuleId;
  visible: boolean;
};

export type HomePrefs = {
  modules: HomeModulePref[];
};

export const HOME_MODULE_META: Record<
  HomeModuleId,
  { eyebrow: string; title: string; summary: string }
> = {
  fuel: {
    eyebrow: "Fuel",
    title: "Nutrition & meals",
    summary: "Log meals and track macros against your goal",
  },
  habits: {
    eyebrow: "Habits",
    title: "Hydration, sleep & recovery",
    summary: "Water, sleep, steps and a recovery snapshot",
  },
  programme: {
    eyebrow: "Programme",
    title: "Your phase",
    summary: "Phase journey and week advance",
  },
  reflect: {
    eyebrow: "Reflect",
    title: "Gratitude, journal & schedule",
    summary: "Three good things, a short note, and the week ahead",
  },
};

const DEFAULT_ORDER: HomeModuleId[] = ["fuel", "habits", "programme", "reflect"];

export function defaultHomePrefs(): HomePrefs {
  return {
    modules: DEFAULT_ORDER.map((id) => ({ id, visible: true })),
  };
}

function normalise(prefs: Partial<HomePrefs> | null | undefined): HomePrefs {
  const defaults = defaultHomePrefs();
  if (!prefs?.modules?.length) return defaults;

  const seen = new Set<HomeModuleId>();
  const modules: HomeModulePref[] = [];

  for (const entry of prefs.modules) {
    if (!entry?.id || !HOME_MODULE_META[entry.id] || seen.has(entry.id)) continue;
    seen.add(entry.id);
    modules.push({ id: entry.id, visible: entry.visible !== false });
  }

  for (const id of DEFAULT_ORDER) {
    if (seen.has(id)) continue;
    modules.push({ id, visible: true });
  }

  return { modules };
}

export function loadHomePrefs(): HomePrefs {
  if (typeof window === "undefined") return defaultHomePrefs();
  try {
    const raw = window.localStorage.getItem(HOME_PREFS_KEY);
    if (!raw) return defaultHomePrefs();
    return normalise(JSON.parse(raw) as Partial<HomePrefs>);
  } catch {
    return defaultHomePrefs();
  }
}

export function saveHomePrefs(prefs: HomePrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HOME_PREFS_KEY, JSON.stringify(normalise(prefs)));
}

export function toggleHomeModule(prefs: HomePrefs, id: HomeModuleId): HomePrefs {
  return {
    modules: prefs.modules.map((module) =>
      module.id === id ? { ...module, visible: !module.visible } : module,
    ),
  };
}

export function moveHomeModule(prefs: HomePrefs, id: HomeModuleId, delta: -1 | 1): HomePrefs {
  const index = prefs.modules.findIndex((module) => module.id === id);
  if (index < 0) return prefs;
  const next = index + delta;
  if (next < 0 || next >= prefs.modules.length) return prefs;
  const modules = [...prefs.modules];
  const [item] = modules.splice(index, 1);
  modules.splice(next, 0, item);
  return { modules };
}

/** Visible modules in user order — always at least one so Home never looks empty. */
export function visibleHomeModules(prefs: HomePrefs): HomeModuleId[] {
  const visible = prefs.modules.filter((module) => module.visible).map((module) => module.id);
  return visible.length ? visible : ["fuel"];
}
