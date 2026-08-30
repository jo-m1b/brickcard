/**
 * Developer space access: always on locally;
 * off-local, enabled via `#developer` (confirmation) and persisted.
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

/** Persist the activation (off-local). No-op if storage is unavailable. */
export function enableDeveloper() {
  try {
    localStorage.setItem(DEVELOPER_ENABLED_KEY, "1");
  } catch {
    /* ignore */
  }
}
