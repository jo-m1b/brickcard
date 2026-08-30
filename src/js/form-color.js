/**
 * Color field (design system): `form-color` + `input.form-control`.
 * Swatch (color picker) + hex + clear (not focusable) overlay.
 *
 * Empty swatch (checkerboard) only if the field is empty *and* there is no
 * default color (`fallback` / `fallbackColor`). Otherwise the swatch
 * shows the value or the default.
 */

import { ICON_CLOSE_CIRCLE } from "./icons.js";
import { parseHexColor } from "./themes-data.js";
import { _t } from "./i18n.js";

/** Technical value for `<input type="color">` when there is no display default. */
const PICKER_SEED = "#ffffff";

/**
 * @param {string} value
 * @returns {string|null} #rrggbb or null
 */
export function normalizeHex(value) {
  const parsed = parseHexColor(value);
  if (parsed) return parsed;
  const v = String(value || "").trim();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

/**
 * “Complete” hex for live input: 6 digits only (no #rgb expansion).
 * Avoids turning `#fff` into `#ffffff` while typing `#fffccc`.
 * @param {string} value
 * @returns {string|null}
 */
export function completeHex(value) {
  return parseHexColor(value) || null;
}

/**
 * Markup for a color control.
 * @param {{
 *   id: string,
 *   value?: string,
 *   fallback?: string|null,
 *   placeholder?: string,
 *   describedBy?: string,
 *   required?: boolean,
 *   sm?: boolean,
 *   withClear?: boolean,
 *   disabled?: boolean,
 *   name?: string,
 * }} opts
 * @returns {string}
 */
export function formColorMarkup(opts) {
  const id = opts.id;
  const value = opts.value || "";
  const fallback = normalizeHex(opts.fallback ?? "");
  const placeholder = opts.placeholder || fallback || "#ffffff";
  const describedBy = opts.describedBy || "";
  const required = Boolean(opts.required);
  const sm = Boolean(opts.sm);
  const disabled = Boolean(opts.disabled);
  const withClear = opts.withClear !== false && !disabled;
  const name = opts.name || id;
  const stored = normalizeHex(value);
  const swatchColor = stored || fallback;
  const nativeVal = swatchColor || PICKER_SEED;
  const ariaDesc = describedBy ? ` aria-describedby="${escapeAttr(describedBy)}"` : "";
  const swatchClass = swatchColor ? "form-color-swatch" : "form-color-swatch is-empty";
  const swatchStyle = swatchColor ? ` style="--swatch:${escapeAttr(swatchColor)}"` : "";
  const disabledAttr = disabled ? " disabled" : "";

  return `
    <div class="form-color" data-form-color>
      <input
        class="form-control${sm ? " sm" : ""} form-color-hex"
        type="text"
        id="${escapeAttr(id)}"
        name="${escapeAttr(name)}"
        value="${escapeAttr(stored || "")}"
        maxlength="7"
        placeholder="${escapeAttr(placeholder)}"
        spellcheck="false"
        autocomplete="off"
        ${required ? "required" : ""}
        ${ariaDesc}${disabledAttr}
      />
      <label class="${swatchClass}" title="${_t("Choose a color")}"${swatchStyle}>
        <span class="visually-hidden">${_t("Open the color picker")}</span>
        <input type="color" class="form-color-native" value="${escapeAttr(nativeVal)}" tabindex="-1"${disabledAttr} />
      </label>
      ${
        withClear
          ? `<button type="button" class="form-color-clear" tabindex="-1" ${stored ? "" : "hidden"} aria-label="${_t("Clear color")}">${ICON_CLOSE_CIRCLE}</button>`
          : ""
      }
    </div>
  `;
}

/**
 * Sync swatch / hex / clear inside a `.form-color`.
 * @param {HTMLElement} root
 * @param {{
 *   onChange?: (value: string) => void,
 *   fallbackColor?: string|null,
 * }} [opts]
 * @returns {{ destroy: () => void, setValue: (stored: string, displayFallback?: string|null) => void, getValue: () => string }}
 */
export function bindFormColor(root, opts = {}) {
  const onChange = opts.onChange;
  /** @type {string|null} */
  let fallbackColor =
    opts.fallbackColor === undefined
      ? null
      : normalizeHex(opts.fallbackColor ?? "");

  const native = /** @type {HTMLInputElement|null} */ (root.querySelector(".form-color-native"));
  const hex = /** @type {HTMLInputElement|null} */ (root.querySelector(".form-color-hex"));
  const clear = /** @type {HTMLButtonElement|null} */ (root.querySelector(".form-color-clear"));
  const swatch = /** @type {HTMLElement|null} */ (root.querySelector(".form-color-swatch"));

  if (!native || !hex || !swatch) {
    return {
      destroy() {},
      setValue() {},
      getValue() {
        return "";
      },
    };
  }

  if (clear) clear.tabIndex = -1;

  const clearMode = root.getAttribute("data-clear-mode") || "auto";
  /** @type {string} */
  let lastValid =
    normalizeHex(hex.value) || fallbackColor || normalizeHex(native.value) || PICKER_SEED;

  function paintSwatch(/** @type {string|null} */ color) {
    if (color) {
      swatch.style.setProperty("--swatch", color);
      swatch.classList.remove("is-empty");
    } else {
      swatch.style.removeProperty("--swatch");
      swatch.classList.add("is-empty");
    }
  }

  /** Swatch: value, else default, else transparent checkerboard. */
  function paintEmptyOrFallback() {
    paintSwatch(fallbackColor);
  }

  function pickerSeed() {
    return fallbackColor || PICKER_SEED;
  }

  function syncClear(hasValue) {
    if (!clear || clearMode === "omit") return;
    clear.hidden = !hasValue;
  }

  function emit(value) {
    onChange?.(value);
  }

  function applyFromHex(/** @type {boolean} */ commit) {
    const raw = hex.value.trim();
    /* While typing: #rrggbb / rrggbb only (no #rgb expansion) */
    const normalized = completeHex(raw);
    if (normalized) {
      lastValid = normalized;
      native.value = normalized;
      paintSwatch(normalized);
      syncClear(true);
      if (commit) emit(normalized);
    } else if (!raw) {
      native.value = pickerSeed();
      paintEmptyOrFallback();
      syncClear(false);
      if (commit) emit("");
    } else {
      /* Incomplete or invalid (#fff, text…): swatch = default or transparent */
      native.value = pickerSeed();
      paintEmptyOrFallback();
      syncClear(true);
    }
  }

  function onNativeInput() {
    const normalized = completeHex(native.value);
    if (!normalized) return;
    lastValid = normalized;
    hex.value = normalized;
    paintSwatch(normalized);
    syncClear(true);
    emit(normalized);
  }

  function onClear() {
    hex.value = "";
    native.value = pickerSeed();
    paintEmptyOrFallback();
    syncClear(false);
    emit("");
    hex.focus();
  }

  function syncPlaceholder() {
    if (fallbackColor) hex.placeholder = fallbackColor;
  }

  function setValue(stored, displayFallback) {
    if (displayFallback !== undefined) {
      fallbackColor = normalizeHex(displayFallback ?? "");
    }
    syncPlaceholder();
    const normalized = normalizeHex(stored);
    hex.value = normalized || "";
    native.value = normalized || pickerSeed();
    lastValid = normalized || fallbackColor || PICKER_SEED;
    if (normalized) {
      paintSwatch(normalized);
      syncClear(true);
    } else {
      paintEmptyOrFallback();
      syncClear(false);
    }
  }

  function getValue() {
    return completeHex(hex.value) || normalizeHex(hex.value) || "";
  }

  syncPlaceholder();
  applyFromHex(false);

  const onHexInput = () => applyFromHex(true);
  const onHexBlur = () => {
    const raw = hex.value.trim();
    if (!raw) {
      applyFromHex(true);
      return;
    }
    /* On blur only: normalize (#, case, #rgb → #rrggbb expansion) */
    const normalized = normalizeHex(raw);
    if (normalized) {
      hex.value = normalized;
      lastValid = normalized;
      native.value = normalized;
      paintSwatch(normalized);
      syncClear(true);
      emit(normalized);
    }
  };

  native.addEventListener("input", onNativeInput);
  hex.addEventListener("input", onHexInput);
  hex.addEventListener("blur", onHexBlur);
  clear?.addEventListener("click", onClear);

  return {
    destroy() {
      native.removeEventListener("input", onNativeInput);
      hex.removeEventListener("input", onHexInput);
      hex.removeEventListener("blur", onHexBlur);
      clear?.removeEventListener("click", onClear);
    },
    setValue,
    getValue,
  };
}

/** @param {string} str */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
