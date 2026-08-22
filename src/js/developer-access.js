/**
 * Accès à l’espace développeur : toujours actif en local ;
 * hors local, activé via `#developer` (confirmation) et persisté.
 */

import { isLocalDevHost } from "./themes-data.js";

const DEVELOPER_ENABLED_KEY = "brickcard:developer-enabled";

/**
 * @returns {boolean}
 */
export function isDeveloperEnabled() {
  if (isLocalDevHost()) return true;
  try {
    return localStorage.getItem(DEVELOPER_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persiste l’activation (hors local). No-op si le stockage est indisponible. */
export function enableDeveloper() {
  try {
    localStorage.setItem(DEVELOPER_ENABLED_KEY, "1");
  } catch {
    /* ignore */
  }
}
