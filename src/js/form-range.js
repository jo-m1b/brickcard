/**
 * Curseur design system : `form-range-row` + reset optionnel (valeur par défaut).
 * Bouton close-circle après l’input / output, non focusable, emplacement toujours
 * réservé, icône visible si ≠ défaut.
 */

import { ICON_CLOSE_CIRCLE } from "./icons.js";

/**
 * Markup du bouton restaurer (à placer après input / output).
 * @returns {string}
 */
export function formRangeResetMarkup() {
  return `<button type="button" class="form-range-reset" tabindex="-1" aria-hidden="true" aria-label="Restaurer la valeur par défaut">${ICON_CLOSE_CIRCLE}</button>`;
}

/**
 * Synchronise output, gras, visibilité du reset.
 * @param {HTMLElement} row
 * @param {{
 *   defaultValue: number|string,
 *   format?: (value: string) => string,
 *   onChange?: (value: string) => void,
 * }} opts
 * @returns {{ destroy: () => void, setValue: (value: number|string) => void, getValue: () => string }}
 */
export function bindFormRange(row, opts) {
  const defaultValue = opts.defaultValue;
  const format = opts.format;
  const onChange = opts.onChange;

  const input = /** @type {HTMLInputElement|null} */ (
    row.querySelector('input[type="range"]')
  );
  const output = /** @type {HTMLOutputElement|null} */ (row.querySelector("output"));
  const reset = /** @type {HTMLButtonElement|null} */ (row.querySelector(".form-range-reset"));

  if (!input) {
    return {
      destroy() {},
      setValue() {},
      getValue() {
        return "";
      },
    };
  }

  if (reset) {
    reset.tabIndex = -1;
    if (input.disabled) reset.disabled = true;
  }

  function isDefault() {
    return Number(input.value) === Number(defaultValue);
  }

  /** @param {string} value */
  function labeled(value) {
    return format ? format(value) : value;
  }

  function syncUi() {
    const value = input.value;
    const custom = !isDefault();
    row.classList.toggle("is-custom", custom);
    input.setAttribute("aria-valuenow", value);
    const text = labeled(value);
    input.setAttribute("aria-valuetext", text);
    if (output) output.textContent = text;
    if (reset) reset.setAttribute("aria-hidden", custom ? "false" : "true");
  }

  function emit() {
    onChange?.(input.value);
    syncUi();
  }

  function onReset() {
    if (input.disabled || isDefault()) return;
    input.value = String(defaultValue);
    emit();
    input.focus();
  }

  /** @param {number|string} value */
  function setValue(value) {
    input.value = String(value);
    syncUi();
  }

  const onInput = () => emit();

  input.addEventListener("input", onInput);
  reset?.addEventListener("click", onReset);

  syncUi();

  return {
    destroy() {
      input.removeEventListener("input", onInput);
      reset?.removeEventListener("click", onReset);
    },
    setValue,
    getValue() {
      return input.value;
    },
  };
}
