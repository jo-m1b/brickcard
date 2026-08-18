/**
 * Focus initial + piège Tab dans la modale au premier plan.
 * Chrome rend les overflow:auto tabulables : `.modal-body` a `tabindex="-1"`.
 * À l’ouverture, le focus va sur `.modal` (tabindex -1) : le premier Tab atteint Fermer.
 */

const TABBABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** @returns {HTMLElement|null} */
export function getTopModal() {
  const root = document.getElementById("modal-root");
  if (!root) return null;
  const backdrops = [...root.querySelectorAll(".modal-backdrop")].filter(
    (el) => el instanceof HTMLElement && !el.hidden
  );
  const top = backdrops[backdrops.length - 1];
  const modal = top?.querySelector(".modal");
  return modal instanceof HTMLElement ? modal : null;
}

/** @param {Element} el */
function isShown(el) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest("[hidden]")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if ("disabled" in el && /** @type {HTMLButtonElement} */ (el).disabled) {
    return false;
  }
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  return true;
}

/** @param {HTMLElement} modal @returns {HTMLElement[]} */
function tabbablesIn(modal) {
  return /** @type {HTMLElement[]} */ (
    [...modal.querySelectorAll(TABBABLE)].filter(isShown)
  );
}

/** Place le focus sur la modale au premier plan (prochain Tab → bouton Fermer). */
export function focusTopModal() {
  const modal = getTopModal();
  if (!modal) return;
  if (modal.getAttribute("tabindex") !== "-1") {
    modal.setAttribute("tabindex", "-1");
  }
  modal.focus({ preventScroll: true });
}

/** Piège Tab dans la modale au premier plan. À installer une fois au boot. */
export function bindModalFocusTrap() {
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "Tab") return;
    const modal = getTopModal();
    if (!modal) return;
    const items = tabbablesIn(modal);
    const active = document.activeElement;
    const inside = active instanceof Node && modal.contains(active);

    if (!items.length) {
      e.preventDefault();
      focusTopModal();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];

    if (!inside || active === modal) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return;
    }
    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
      return;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    }
  }

  document.addEventListener("keydown", onKey, true);
  return () => document.removeEventListener("keydown", onKey, true);
}
