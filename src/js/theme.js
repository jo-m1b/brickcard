/** Thème UI : system (défaut) | light | dark */

const THEME_KEY = "brickcard-generator:ui-theme";
const MODES = ["system", "light", "dark"];

/** @returns {"system"|"light"|"dark"} */
export function getTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

/** @param {"system"|"light"|"dark"} mode */
export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

/** @param {"system"|"light"|"dark"} mode */
export function setTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* ignore */
  }
  applyTheme(mode);
}

export function cycleTheme() {
  const current = getTheme();
  const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
  setTheme(next);
  return next;
}

/** Applique le thème stocké au démarrage. */
export function initTheme() {
  applyTheme(getTheme());
}
