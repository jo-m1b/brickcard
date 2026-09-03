/**
 * Minimal service worker (PWA install + same-origin cache).
 * Must stay at the site root: the default scope is the script’s folder,
 * and GitHub Pages cannot send Service-Worker-Allowed to widen it.
 * Keep APP_VERSION aligned with version.js and the ?v= in index.html
 * (CSS + app.js / version.js import map) and 404.html (CSS).
 * Adding a JS file, markdown page, locale catalog, or data JSON: add it to OFFLINE_ASSETS.
 */
const APP_VERSION = "0.9.1";
const CACHE = `brickcard-${APP_VERSION}`;

const PRECACHE_BATCH = 4;

/**
 * App files for a full offline session (lazy overlays included).
 * Theme logos are appended from themes-presets.json, not listed here.
 * Groups are the download order (modules first, demo last).
 */
const OFFLINE_ASSETS = [
  [
    `./js/app.js?v=${APP_VERSION}`,
    `./js/version.js?v=${APP_VERSION}`,
    "./js/app.js",
    "./js/backup-dialog.js",
    "./js/backup.js",
    "./js/card-design.js",
    "./js/card-export.js",
    "./js/card-render.js",
    "./js/card-sort.js",
    "./js/confirm-dialog.js",
    "./js/developer-access.js",
    "./js/document-title.js",
    "./js/empty-view.js",
    "./js/form-checkbox.js",
    "./js/form-color.js",
    "./js/form-image.js",
    "./js/form-radio.js",
    "./js/form-range.js",
    "./js/form-select.js",
    "./js/hotkeys.js",
    "./js/i18n.js",
    "./js/icons.js",
    "./js/image-optimize.js",
    "./js/import-dialog.js",
    "./js/includes-ci.js",
    "./js/link.js",
    "./js/list-layout.js",
    "./js/markdown.js",
    "./js/modal-focus.js",
    "./js/preset-draft.js",
    "./js/print-dialog.js",
    "./js/print-menu.js",
    "./js/print-qty.js",
    "./js/print-settings.js",
    "./js/print.js",
    "./js/storage.js",
    "./js/telemetry.js",
    "./js/theme.js",
    "./js/themes-data.js",
    "./js/tile.js",
    "./js/toast.js",
    "./js/version.js",
    "./js/views/editor.js",
    "./js/views/list.js",
    "./js/views/page.js",
    "./js/views/settings.js",
    "./js/views/theme-editor.js",
    "./js/views/themes.js",
    "./js/views/developer/buttons.js",
    "./js/views/developer/checkboxes.js",
    "./js/views/developer/colors.js",
    "./js/views/developer/fields.js",
    "./js/views/developer/images.js",
    "./js/views/developer/index.js",
    "./js/views/developer/links.js",
    "./js/views/developer/loading.js",
    "./js/views/developer/modal.js",
    "./js/views/developer/modals.js",
    "./js/views/developer/notifications.js",
    "./js/views/developer/radios.js",
    "./js/views/developer/search.js",
    "./js/views/developer/selects.js",
    "./js/views/developer/sliders.js",
    "./js/views/developer/theme-presets-editor.js",
    "./js/views/developer/theme-presets.js",
    "./js/views/developer/tiles.js",
    "./js/views/developer/typography.js",
    "./js/views/developer/welcome.js",
  ],
  [
    "./i18n/locales.json",
    "./i18n/de.po",
    "./i18n/es.po",
    "./i18n/fr.po",
    "./i18n/it.po",
    "./i18n/pt.po",
  ],
  [
    "./data/page-about.md",
    "./data/page-about.de.md",
    "./data/page-about.es.md",
    "./data/page-about.fr.md",
    "./data/page-about.it.md",
    "./data/page-about.pt.md",
  ],
  ["./data/themes-presets.json", "./data/sets-presets.json"],
  [
    `./css/styles.css?v=${APP_VERSION}`,
    "./fonts/OpenSans-Variable.woff2",
    "./fonts/InterVariable.woff2",
    "./manifest.webmanifest",
    "./img/brickcard-logo.svg",
    "./img/brickcard-favicon.svg",
    "./img/brickcard-favicon.ico",
    "./img/brickcard-favicon-96x96.png",
    "./img/brickcard-apple-touch-icon.png",
    "./img/brickcard-web-app-manifest-192x192.png",
    "./img/brickcard-web-app-manifest-512x512.png",
  ],
  ["./data/backup-demo-jo.brickcard"],
];

/** @type {Promise<void>|null} */
let offlinePrecachePromise = null;

function shouldHandleFetch(request) {
  if (request.method !== "GET") return false;
  const dest = request.destination;
  if (dest === "serviceworker" || dest === "sharedworker" || dest === "worker") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.endsWith("/service-worker.js")) return false;
  return true;
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE);
  for (const path of ["./index.html", "./"]) {
    try {
      const res = await fetch(new URL(path, self.location), { cache: "reload" });
      if (res.ok) await cache.put(res.url, res);
    } catch {
      /* GitHub Pages / network: do not fail the install */
    }
  }
}

/**
 * @param {Cache} cache
 * @param {string} path
 */
async function cachePath(cache, path) {
  const url = new URL(path, self.location);
  if (await cache.match(url.href)) return;
  try {
    const res = await fetch(url, { cache: "reload" });
    if (res.ok) await cache.put(res.url, res);
  } catch {
    /* network: skip this file */
  }
}

/**
 * @param {Cache} cache
 * @param {string[]} paths
 */
async function cachePaths(cache, paths) {
  for (let i = 0; i < paths.length; i += PRECACHE_BATCH) {
    const chunk = paths.slice(i, i + PRECACHE_BATCH);
    await Promise.all(chunk.map((path) => cachePath(cache, path)));
  }
}

/**
 * @param {Cache} cache
 * @returns {Promise<string[]>}
 */
async function themeLogoPaths(cache) {
  const path = "./data/themes-presets.json";
  await cachePath(cache, path);
  const hit = await cache.match(new URL(path, self.location).href);
  if (!hit) return [];
  try {
    const data = await hit.json();
    const themes = Array.isArray(data?.themes) ? data.themes : [];
    /** @type {string[]} */
    const logos = [];
    for (const theme of themes) {
      const src = String(theme?.logoSrc || "").trim();
      if (!src || src.includes("..") || src.startsWith("/") || /^[a-z]+:/i.test(src)) continue;
      logos.push(`./${src.replace(/^\.\//, "")}`);
    }
    return logos;
  } catch {
    return [];
  }
}

async function precacheOfflineAssetsRun() {
  const cache = await caches.open(CACHE);
  const groups = OFFLINE_ASSETS.slice();
  const presetsIndex = groups.findIndex((group) => group.includes("./data/themes-presets.json"));
  for (let i = 0; i < groups.length; i += 1) {
    await cachePaths(cache, groups[i]);
    if (i === presetsIndex) {
      await cachePaths(cache, await themeLogoPaths(cache));
    }
  }
}

function precacheOfflineAssets() {
  if (!offlinePrecachePromise) {
    offlinePrecachePromise = precacheOfflineAssetsRun().finally(() => {
      offlinePrecachePromise = null;
    });
  }
  return offlinePrecachePromise;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => precacheOfflineAssets())
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "precache-offline") return;
  event.waitUntil(precacheOfflineAssets());
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandleFetch(event.request)) return;

  event.respondWith(
    fetch(event.request, { cache: "reload" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(event.request);
        if (hit) return hit;
        if (event.request.mode === "navigate") {
          return (await caches.match("./index.html")) || Response.error();
        }
        return Response.error();
      })
  );
});
