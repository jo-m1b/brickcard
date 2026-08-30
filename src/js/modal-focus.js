/**
 * Initial focus + Tab trap in the frontmost modal.
 * Chrome makes overflow:auto tabbable: `.modal-body` has `tabindex="-1"`.
 * On open, focus goes to `.modal` (tabindex -1): the first Tab reaches the content
 * (Close is not tabbable: Escape / click).
 * Scroll (backdrop + body) is reset to the top, unless `resetScroll: false` (Tab trap).
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
    [...modal.querySelectorAll(TABBABLE)].filter(
      (el) => isShown(el) && !el.classList.contains("modal-close")
    )
  );
}

/** @param {HTMLElement} modal */
function skipCloseButtonTab(modal) {
  modal.querySelectorAll(".modal-close").forEach((btn) => {
    if (btn instanceof HTMLElement) btn.tabIndex = -1;
  });
}

/** @param {HTMLElement} modal */
function resetModalScroll(modal) {
  const backdrop = modal.closest(".modal-backdrop");
  if (backdrop instanceof HTMLElement) backdrop.scrollTop = 0;
  modal.scrollTop = 0;
  modal.querySelectorAll(":scope > .modal-body").forEach((el) => {
    if (el instanceof HTMLElement) el.scrollTop = 0;
  });
}

/**
 * Put focus on the frontmost modal (next Tab → first content control).
 * @param {{ resetScroll?: boolean }} [opts] `resetScroll: false` for the Tab trap
 */
export function focusTopModal(opts = {}) {
  const modal = getTopModal();
  if (!modal) return;
  skipCloseButtonTab(modal);
  if (opts.resetScroll !== false) resetModalScroll(modal);
  if (modal.getAttribute("tabindex") !== "-1") {
    modal.setAttribute("tabindex", "-1");
  }
  modal.focus({ preventScroll: true });
}

/** Tab trap in the frontmost modal. Install once at boot. */
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
      focusTopModal({ resetScroll: false });
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
