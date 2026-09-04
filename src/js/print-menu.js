import { loadCards } from "./storage.js";
import { _t } from "./i18n.js";
import { formatPrintCountLabel, formatPrintMenuDesc } from "./print-settings.js";
import {
  getPrintQty,
  setPrintQty,
  clearPrintQty,
  totalPrintCount,
} from "./print-qty.js";

/**
 * @typedef {object} PrintMenuHooks
 * @property {() => Promise<import("./storage.js").Card[]> | import("./storage.js").Card[]} [getSelectAllCards]
 * @property {() => void} [onSelectionChange]
 */

/** @type {PrintMenuHooks} */
let hooks = {};

/** @type {{ toast: (msg: string, type?: string) => void, onOpenPrint?: () => void } | null} */
let opts = null;

/**
 * @param {PrintMenuHooks} next
 */
export function setPrintMenuHooks(next) {
  hooks = { ...hooks, ...next };
}

export function clearPrintMenuHooks() {
  hooks = {};
}

/**
 * @param {boolean} visible
 */
export function setPrintMenuVisible(visible) {
  const root = document.getElementById("print-menu");
  if (!root) return;
  root.hidden = !visible;
  if (!visible) root.classList.remove("is-open");
}

/**
 * Update badge, summary, and buttons from the selection and card count.
 * @param {{
 *   numCards?: number,
 *   numAddable?: number,
 *   searching?: boolean,
 *   missing?: boolean,
 * }} [state]
 */
export function syncPrintMenu(state = {}) {
  const root = document.getElementById("print-menu");
  const btn = document.getElementById("btn-print-menu");
  const countEl = document.getElementById("print-menu-num");
  const title = document.getElementById("print-menu-title");
  const desc = document.getElementById("print-menu-desc");
  const btnSelectAll = document.getElementById("btn-print-select-all");
  const selectAllLabel = document.getElementById("print-select-all-label");
  const btnSelectNone = document.getElementById("btn-print-select-none");
  const btnRun = document.getElementById("btn-print-run");
  if (!root || !btn) return;

  const count = totalPrintCount();
  const numCards =
    state.numCards != null
      ? state.numCards
      : Number(root.dataset.numCards || 0);

  if (state.numCards != null) {
    root.dataset.numCards = String(numCards);
  }
  if (state.numAddable != null) {
    root.dataset.numAddable = String(state.numAddable);
  }
  if (state.searching != null) {
    root.dataset.searching = state.searching ? "1" : "0";
  }
  if (state.missing != null) {
    root.dataset.missing = state.missing ? "1" : "0";
  }

  const numAddable =
    state.numAddable != null
      ? state.numAddable
      : Number(root.dataset.numAddable || 0);
  const searching =
    state.searching != null ? state.searching : root.dataset.searching === "1";
  const missing =
    state.missing != null ? state.missing : root.dataset.missing === "1";

  btn.classList.toggle("is-empty", count === 0);
  btn.setAttribute(
    "aria-label",
    count > 0
      ? count === 1
        ? _t("Print — %(count)s card", { count })
        : _t("Print — %(count)s cards", { count })
      : _t("Print")
  );

  if (countEl) {
    if (count > 0) {
      countEl.hidden = false;
      countEl.textContent = String(count);
    } else {
      countEl.hidden = true;
    }
  }

  if (title) {
    if (!count) {
      title.textContent = _t("No cards to print!");
    } else {
      title.textContent = formatPrintCountLabel(count);
    }
  }

  if (desc) {
    if (!count) {
      desc.textContent = _t(
        "Select at least one card to print from your collection."
      );
    } else {
      desc.textContent = formatPrintMenuDesc(count);
    }
  }

  if (btnSelectAll) {
    const showAdd = numAddable >= 2 || (numAddable === 1 && missing);
    btnSelectAll.hidden = !showAdd;
    if (showAdd && selectAllLabel) {
      const oneMissing = missing && numAddable === 1;
      if (searching) {
        if (oneMissing) {
          selectAllLabel.textContent = _t("Add the missing card from the search");
        } else if (missing) {
          selectAllLabel.textContent = _t(
            "Add the %(count)s missing cards from the search",
            { count: numAddable }
          );
        } else {
          selectAllLabel.textContent = _t("Add the %(count)s cards from the search", {
            count: numAddable,
          });
        }
      } else if (oneMissing) {
        selectAllLabel.textContent = _t("Add the missing card");
      } else if (missing) {
        selectAllLabel.textContent = _t("Add the %(count)s missing cards", {
          count: numAddable,
        });
      } else {
        selectAllLabel.textContent = _t("Add the %(count)s cards", {
          count: numAddable,
        });
      }
    }
  }
  if (btnSelectNone) {
    btnSelectNone.hidden = count === 0;
  }
  if (btnRun) {
    btnRun.disabled = count === 0;
  }
}

function setOpen(open) {
  const root = document.getElementById("print-menu");
  const btn = document.getElementById("btn-print-menu");
  if (!root || !btn) return;
  root.classList.toggle("is-open", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (!open) {
    const active = document.activeElement;
    if (active instanceof HTMLElement && root.contains(active)) {
      active.blur();
    }
  }
}

function notifyChange() {
  hooks.onSelectionChange?.();
  syncPrintMenu();
}

/**
 * @param {{ toast: (msg: string, type?: string) => void, onOpenPrint?: () => void }} options
 */
export function initPrintMenu(options) {
  opts = options;
  const root = document.getElementById("print-menu");
  const btn = document.getElementById("btn-print-menu");
  const panel = document.getElementById("print-menu-panel");
  const btnSelectAll = document.getElementById("btn-print-select-all");
  const btnSelectNone = document.getElementById("btn-print-select-none");
  const btnRun = document.getElementById("btn-print-run");
  if (!root || !btn || !panel) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!root.classList.contains("is-open"));
  });

  panel.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", (e) => {
    if (!root.classList.contains("is-open")) return;
    const t = /** @type {Node} */ (e.target);
    if (root.contains(t)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!root.classList.contains("is-open") && !root.contains(document.activeElement)) {
      return;
    }
    e.preventDefault();
    setOpen(false);
  });

  btnSelectAll?.addEventListener("click", async () => {
    let cards;
    try {
      cards = hooks.getSelectAllCards
        ? await hooks.getSelectAllCards()
        : await loadCards();
    } catch (err) {
      opts?.toast(err.message || _t("Unable to select the cards"), "error");
      return;
    }
    for (const c of cards) {
      if (getPrintQty(c.id) < 1) setPrintQty(c.id, 1);
    }
    notifyChange();
  });

  btnSelectNone?.addEventListener("click", () => {
    clearPrintQty();
    notifyChange();
  });

  btnRun?.addEventListener("click", () => {
    setOpen(false);
    opts?.onOpenPrint?.();
  });

  syncPrintMenu();
}
