import { loadCards } from "./storage.js";
import { printCards, CARDS_PER_PAGE } from "./print.js";
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

/** @type {{ toast: (msg: string, type?: string) => void } | null} */
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
 * Met à jour badge, résumé et boutons selon la sélection et le nombre de cartes.
 * @param {{
 *   cardCount?: number,
 *   addableCount?: number,
 *   searching?: boolean,
 *   missing?: boolean,
 * }} [state]
 */
export function syncPrintMenu(state = {}) {
  const root = document.getElementById("print-menu");
  const btn = document.getElementById("btn-print-menu");
  const countEl = document.getElementById("print-menu-count");
  const title = document.getElementById("print-menu-title");
  const desc = document.getElementById("print-menu-desc");
  const btnSelectAll = document.getElementById("btn-print-select-all");
  const selectAllLabel = document.getElementById("print-select-all-label");
  const btnSelectNone = document.getElementById("btn-print-select-none");
  const btnRun = document.getElementById("btn-print-run");
  if (!root || !btn) return;

  const count = totalPrintCount();
  const cardCount =
    state.cardCount != null
      ? state.cardCount
      : Number(root.dataset.cardCount || 0);

  if (state.cardCount != null) {
    root.dataset.cardCount = String(cardCount);
  }
  if (state.addableCount != null) {
    root.dataset.addableCount = String(state.addableCount);
  }
  if (state.searching != null) {
    root.dataset.searching = state.searching ? "1" : "0";
  }
  if (state.missing != null) {
    root.dataset.missing = state.missing ? "1" : "0";
  }

  const addableCount =
    state.addableCount != null
      ? state.addableCount
      : Number(root.dataset.addableCount || 0);
  const searching =
    state.searching != null ? state.searching : root.dataset.searching === "1";
  const missing =
    state.missing != null ? state.missing : root.dataset.missing === "1";

  btn.classList.toggle("is-empty", count === 0);
  btn.setAttribute(
    "aria-label",
    count > 0
      ? `Impression — ${count} carte${count > 1 ? "s" : ""}`
      : "Impression"
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
      title.textContent = "Aucune carte à imprimer !";
    } else {
      title.textContent = `${count} carte${count > 1 ? "s" : ""} à imprimer`;
    }
  }

  if (desc) {
    if (!count) {
      desc.textContent =
        "Sélectionnez les cartes à imprimer parmi celles de la collection";
    } else {
      const pages = Math.ceil(count / CARDS_PER_PAGE);
      desc.textContent = `${pages} feuille${pages > 1 ? "s" : ""} A4 recto-verso`;
    }
  }

  if (btnSelectAll) {
    const showAdd = addableCount >= 2 || (addableCount === 1 && missing);
    btnSelectAll.hidden = !showAdd;
    if (showAdd && selectAllLabel) {
      const oneMissing = missing && addableCount === 1;
      if (searching) {
        if (oneMissing) {
          selectAllLabel.textContent = "Ajouter la carte manquante de la recherche";
        } else if (missing) {
          selectAllLabel.textContent = `Ajouter les ${addableCount} cartes manquantes de la recherche`;
        } else {
          selectAllLabel.textContent = `Ajouter les ${addableCount} cartes de la recherche`;
        }
      } else if (oneMissing) {
        selectAllLabel.textContent = "Ajouter la carte manquante";
      } else if (missing) {
        selectAllLabel.textContent = `Ajouter les ${addableCount} cartes manquantes`;
      } else {
        selectAllLabel.textContent = `Ajouter les ${addableCount} cartes`;
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
 * @param {{ toast: (msg: string, type?: string) => void }} options
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
      opts?.toast(err.message || "Impossible de charger les cartes", "error");
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

  btnRun?.addEventListener("click", async () => {
    let cards;
    try {
      cards = await loadCards();
    } catch (err) {
      opts?.toast(err.message || "Impossible de charger les cartes", "error");
      return;
    }
    /** @type {import("./storage.js").Card[]} */
    const toPrint = [];
    for (const card of cards) {
      const qty = getPrintQty(card.id);
      for (let i = 0; i < qty; i++) toPrint.push(card);
    }
    if (!toPrint.length) return;
    btnRun.disabled = true;
    setOpen(false);
    try {
      await printCards(toPrint);
    } catch (err) {
      opts?.toast(err.message || "Erreur d'impression", "error");
    } finally {
      syncPrintMenu();
    }
  });

  syncPrintMenu();
}
