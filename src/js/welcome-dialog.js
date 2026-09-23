/**
 * First-visit welcome (child dialog, no hash).
 * Shown on home while `brickcard:welcome-seen` is missing.
 * Off-local, if telemetry was never chosen: yes/no ask (No / dismiss stores off).
 * Leaving home without closing does not mark it seen.
 */

import { ICON_CLOSE, ICON_EMOTION, modalTitleMarkup } from "./icons.js";
import { linkMarkup } from "./link.js";
import { focusTopModal } from "./modal-focus.js";
import { popModalDocumentTitle, pushModalDocumentTitle } from "./document-title.js";
import { _t } from "./i18n.js";
import {
  hasTelemetryChoice,
  htmlWithPublicStatsLink,
  isTelemetryAvailable,
  setTelemetry,
  TELEMETRY_PUBLIC_STATS_LABEL,
  TELEMETRY_PUBLIC_STATS_URL,
} from "./telemetry.js";

const WELCOME_SEEN_KEY = "brickcard:welcome-seen";
const BACKDROP_ID = "welcome-dialog-backdrop";

/** @type {null | (() => void)} */
let dismissWithoutChoice = null;

/** @returns {boolean} */
export function isWelcomeSeen() {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Translated sentence with the public-stats link in place of `%(link)s`.
 * Visible label is the domain; the href is the full public board.
 * @param {string} msgid
 */
function htmlWithStatsLink(msgid) {
  return htmlWithPublicStatsLink(
    msgid,
    linkMarkup(TELEMETRY_PUBLIC_STATS_LABEL, {
      href: TELEMETRY_PUBLIC_STATS_URL,
    }),
  );
}

/**
 * @param {boolean} ask
 */
function bodyHtml(ask) {
  const intro = escapeHtml(
    _t(
      "Brickcard is a tiny app for creating and printing lovely playing-card sized cards for your LEGO® bricks that describe your LEGO® sets (reference, photo, title, theme, year, and piece count).",
    ),
  );
  const story = escapeHtml(
    _t(
      "Create cards, print them, laminate them, and slip them into a clear sleeve with a set whose box has gone missing. My kids love them — and it helps avoid unpacking the wrong set by mistake :P",
    ),
  );
  const disclaimerLego = escapeHtml(
    _t(
      "LEGO® is a trademark of the LEGO Group, which does not sponsor, authorize or endorse this application. Brickcard is a personal, non-commercial project.",
    ),
  );
  const disclaimerOther = escapeHtml(
    _t(
      "Other product names, logos, and brands shown in the app are trademarks of their respective owners. They are used only to help identify LEGO® themes. Brickcard is not affiliated with, sponsored by, or endorsed by those owners.",
    ),
  );
  const askHtml = ask
    ? `<p>${htmlWithStatsLink("This application is free and open source: no account, no ads, and you can install it on your own server. My best reward is simply knowing whether it is used, thanks to anonymous usage statistics. Nothing identifies you and no IP address is stored. Usage data is public and published on %(link)s. At any time, you can turn telemetry on or off from the application settings.")}</p>`
    : "";
  return `<div class="welcome-copy">
    <p>${intro}</p>
    <p>${story}</p>
    <blockquote>
      <p>${disclaimerLego}</p>
      <p>${disclaimerOther}</p>
    </blockquote>
    ${askHtml}
  </div>`;
}

/**
 * @param {boolean} ask
 */
function footerHtml(ask) {
  if (!ask) {
    return `<div class="modal-footer modal-footer--primary-first">
      <div class="modal-footer-end">
        <button type="button" class="btn primary" data-welcome="ok">${ICON_EMOTION}<span>${escapeHtml(_t("Got it"))}</span></button>
      </div>
    </div>`;
  }
  return `<div class="modal-footer modal-footer--primary-first">
    <div class="modal-footer-end">
      <button type="button" class="btn primary" data-welcome="yes">${ICON_EMOTION}<span>${escapeHtml(_t("Yes, enable telemetry"))}</span></button>
      <button type="button" class="btn secondary sm" data-welcome="no">${escapeHtml(_t("No thanks"))}</button>
    </div>
  </div>`;
}

/**
 * Open the welcome modal when it has not been dismissed yet.
 * @param {HTMLElement} host `#modal-root`
 */
export function openWelcomeIfNeeded(host) {
  if (!(host instanceof HTMLElement)) return;
  if (isWelcomeSeen()) return;
  if (dismissWithoutChoice) return;
  if (host.querySelector(`#${BACKDROP_ID}`)) return;

  const ask = isTelemetryAvailable() && !hasTelemetryChoice();
  const title = _t("Welcome to Brickcard");
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = BACKDROP_ID;
  backdrop.setAttribute("role", "presentation");
  backdrop.innerHTML = `
    <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="welcome-dialog-title">
      <div class="modal-header">
        <div>
          <h1 class="view-title" id="welcome-dialog-title">${modalTitleMarkup(title)}</h1>
        </div>
        <button type="button" class="btn primary icon-only modal-close" tabindex="-1" data-welcome-dismiss>
          ${ICON_CLOSE}
          <span class="visually-hidden">${escapeHtml(_t("Close"))}</span>
        </button>
      </div>
      <div class="modal-body" tabindex="-1">
        ${bodyHtml(ask)}
      </div>
      ${footerHtml(ask)}
    </div>
  `;

  const addedModalOpen = !document.body.classList.contains("modal-open");
  if (addedModalOpen) document.body.classList.add("modal-open");

  let settled = false;

  const mo = new MutationObserver(() => {
    if (!backdrop.isConnected) finish("destroyed");
  });

  /**
   * @param {"yes"|"no"|"ok"|"destroyed"} reason
   */
  function finish(reason) {
    if (settled) return;
    settled = true;
    dismissWithoutChoice = null;
    mo.disconnect();
    document.removeEventListener("keydown", onKey, true);
    if (backdrop.isConnected) backdrop.remove();
    popModalDocumentTitle();
    if (addedModalOpen && !host.querySelector(".modal-backdrop")) {
      document.body.classList.remove("modal-open");
    }
    if (reason === "destroyed") return;
    if (reason === "yes") setTelemetry(true);
    else if (reason === "no") setTelemetry(false);
    markWelcomeSeen();
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "Escape" || !backdrop.isConnected) return;
    const top = host.querySelector(":scope > .modal-backdrop:last-child");
    if (top !== backdrop) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    finish(ask ? "no" : "ok");
  }

  dismissWithoutChoice = () => finish("destroyed");

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) finish(ask ? "no" : "ok");
  });
  backdrop.querySelector("[data-welcome-dismiss]")?.addEventListener("click", () => {
    finish(ask ? "no" : "ok");
  });
  backdrop.querySelectorAll("[data-welcome]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-welcome");
      if (action === "yes" || action === "no" || action === "ok") finish(action);
    });
  });

  document.addEventListener("keydown", onKey, true);
  host.appendChild(backdrop);
  pushModalDocumentTitle(title);
  mo.observe(host, { childList: true });
  queueMicrotask(() => focusTopModal());
}

/** Remove the welcome modal without storing a choice (route left home). */
export function dismissWelcomeDialog() {
  dismissWithoutChoice?.();
}
