/**
 * Surcouche unobtrusive pour `<select class="form-control">`.
 * Conserve le select natif (soumission / a11y de secours) et affiche
 * un déclencheur + liste stylables.
 * L’option placeholder (value="") n’apparaît pas dans la liste ; un reset
 * (ri-close-circle-fill) permet d’y revenir.
 */

import { ICON_ARROW_DOWN_S_LINE, ICON_CLOSE_CIRCLE, remixIconByName } from "./icons.js";
import { _t } from "./i18n.js";

/**
 * Améliore tous les `select.form-control` dans un conteneur.
 * @param {ParentNode} root
 * @returns {() => void} cleanup
 */
export function enhanceFormSelects(root) {
  /** @type {(() => void)[]} */
  const cleanups = [];
  root.querySelectorAll("select.form-control").forEach((el) => {
    if (!(el instanceof HTMLSelectElement)) return;
    if (el.closest(".form-select")) return;
    cleanups.push(enhanceFormSelect(el));
  });
  return () => cleanups.forEach((fn) => fn());
}

/**
 * @param {HTMLSelectElement} select
 * @returns {() => void}
 */
export function enhanceFormSelect(select) {
  if (select.dataset.formSelectEnhanced === "1") {
    return () => {};
  }
  select.dataset.formSelectEnhanced = "1";

  const wrap = document.createElement("div");
  wrap.className = "form-select";
  if (select.classList.contains("sm")) wrap.classList.add("sm");
  if (select.disabled) wrap.classList.add("is-disabled");
  if (select.classList.contains("is-invalid") || select.getAttribute("aria-invalid") === "true") {
    wrap.classList.add("is-invalid");
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "form-control form-select-trigger";
  if (select.classList.contains("sm")) trigger.classList.add("sm");
  if (select.classList.contains("is-invalid") || select.getAttribute("aria-invalid") === "true") {
    trigger.classList.add("is-invalid");
  }
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.disabled = select.disabled;
  const describedBy = select.getAttribute("aria-describedby");
  if (describedBy) trigger.setAttribute("aria-describedby", describedBy);
  if (select.getAttribute("aria-invalid") === "true") {
    trigger.setAttribute("aria-invalid", "true");
  }
  if (select.required) trigger.setAttribute("aria-required", "true");

  const valueEl = document.createElement("span");
  valueEl.className = "form-select-value";
  const valueIconsLeft = document.createElement("span");
  valueIconsLeft.className = "form-select-icon form-select-icon--left";
  valueIconsLeft.hidden = true;
  const valueText = document.createElement("span");
  valueText.className = "form-select-value-text";
  const valueIconsRight = document.createElement("span");
  valueIconsRight.className = "form-select-icon form-select-icon--right";
  valueIconsRight.hidden = true;
  valueEl.append(valueIconsLeft, valueText, valueIconsRight);
  const chevron = document.createElement("span");
  chevron.className = "form-select-chevron";
  chevron.innerHTML = ICON_ARROW_DOWN_S_LINE;
  trigger.append(valueEl, chevron);

  const hasPlaceholder = Array.from(select.options).some((o) => o.value === "");
  /** @type {HTMLButtonElement|null} */
  let clearBtn = null;
  if (hasPlaceholder) {
    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "form-select-clear";
    clearBtn.tabIndex = -1;
    clearBtn.setAttribute("aria-label", _t("Clear selection"));
    clearBtn.innerHTML = ICON_CLOSE_CIRCLE;
    clearBtn.hidden = true;
    clearBtn.disabled = select.disabled;
  }

  const list = document.createElement("ul");
  list.className = "form-select-list";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  list.id = `${select.id || `form-select-${Math.random().toString(36).slice(2, 9)}`}-list`;
  trigger.setAttribute("aria-controls", list.id);

  const parent = select.parentNode;
  if (!parent) return () => {};
  parent.insertBefore(wrap, select);
  wrap.append(select, trigger);
  if (clearBtn) wrap.append(clearBtn);
  wrap.append(list);

  select.classList.add("form-select-native");
  select.setAttribute("tabindex", "-1");
  select.setAttribute("aria-hidden", "true");

  /** @type {HTMLElement[]} */
  let optionEls = [];
  /** @type {number} */
  let activeIndex = -1;

  /** @param {HTMLOptionElement} opt */
  function isPlaceholderOption(opt) {
    return opt.value === "";
  }

  function selectedOption() {
    return select.options[select.selectedIndex] || null;
  }

  function syncClear() {
    if (!clearBtn) return;
    clearBtn.hidden = select.disabled || select.value === "";
  }

  /** @param {HTMLOptionElement|null} opt */
  function optionIcons(opt) {
    if (!opt) return { left: "", right: "" };
    return {
      left: remixIconByName(opt.getAttribute("data-icon-left")),
      right: remixIconByName(opt.getAttribute("data-icon-right")),
    };
  }

  /** @param {HTMLElement} host @param {string} svg @param {boolean} show */
  function setIconSlot(host, svg, show) {
    if (show && svg) {
      host.innerHTML = svg;
      host.hidden = false;
    } else {
      host.innerHTML = "";
      host.hidden = true;
    }
  }

  function syncTriggerLabel() {
    const opt = selectedOption();
    const text = opt ? opt.textContent || "" : "";
    valueText.textContent = text;
    const empty = !opt || isPlaceholderOption(opt);
    valueEl.classList.toggle("is-placeholder", empty && Boolean(text));
    const icons = optionIcons(empty ? null : opt);
    setIconSlot(valueIconsLeft, icons.left, Boolean(icons.left));
    setIconSlot(valueIconsRight, icons.right, Boolean(icons.right));
    syncClear();
  }

  function rebuildList() {
    list.replaceChildren();
    optionEls = [];
    const children = Array.from(select.children);
    for (const child of children) {
      if (child instanceof HTMLOptGroupElement) {
        const opts = Array.from(child.children).filter(
          (o) => o instanceof HTMLOptionElement && !isPlaceholderOption(o)
        );
        if (!opts.length) continue;
        const label = document.createElement("li");
        label.className = "form-select-group";
        label.setAttribute("role", "presentation");
        label.textContent = child.label;
        list.append(label);
        opts.forEach((opt) => list.append(makeOptionItem(opt)));
      } else if (child instanceof HTMLOptionElement) {
        if (isPlaceholderOption(child)) continue;
        list.append(makeOptionItem(child));
      }
    }
    syncSelectedInList();
  }

  /** @param {HTMLOptionElement} opt */
  function makeOptionItem(opt) {
    const li = document.createElement("li");
    li.className = "form-select-option";
    li.setAttribute("role", "option");
    li.dataset.value = opt.value;
    li.id = `${list.id}-opt-${optionEls.length}`;
    if (opt.disabled) {
      li.classList.add("is-disabled");
      li.setAttribute("aria-disabled", "true");
    }

    const icons = optionIcons(opt);
    if (icons.left) {
      const slot = document.createElement("span");
      slot.className = "form-select-icon form-select-icon--left";
      slot.innerHTML = icons.left;
      li.append(slot);
    }
    const label = document.createElement("span");
    label.className = "form-select-option-label";
    label.textContent = opt.textContent || "";
    li.append(label);
    if (icons.right) {
      const slot = document.createElement("span");
      slot.className = "form-select-icon form-select-icon--right";
      slot.innerHTML = icons.right;
      li.append(slot);
    }

    li.addEventListener("click", (e) => {
      e.preventDefault();
      if (opt.disabled) return;
      chooseValue(opt.value);
      close(true);
    });
    li.addEventListener("pointerenter", () => {
      if (opt.disabled || !isOpen()) return;
      const idx = optionEls.indexOf(li);
      if (idx >= 0) setActive(idx);
    });
    optionEls.push(li);
    return li;
  }

  function syncSelectedInList() {
    const current = select.value;
    let selectedIdx = -1;
    optionEls.forEach((li, i) => {
      const on = li.dataset.value === current;
      li.setAttribute("aria-selected", on ? "true" : "false");
      li.classList.toggle("is-selected", on);
      if (on) selectedIdx = i;
    });
    if (selectedIdx >= 0) activeIndex = selectedIdx;
  }

  function clearActive() {
    activeIndex = -1;
    optionEls.forEach((li) => li.classList.remove("is-active"));
    trigger.removeAttribute("aria-activedescendant");
  }

  /** @param {string} value */
  function chooseValue(value) {
    if (select.value === value) {
      syncTriggerLabel();
      syncSelectedInList();
      return;
    }
    select.value = value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncTriggerLabel();
    syncSelectedInList();
  }

  function isOpen() {
    return wrap.classList.contains("is-open");
  }

  function open() {
    if (select.disabled || isOpen()) return;
    rebuildList();
    if (!optionEls.length) return;
    wrap.classList.add("is-open");
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    syncSelectedInList();
    const selectedIdx = optionEls.findIndex((li) => li.classList.contains("is-selected"));
    if (selectedIdx >= 0) setActive(selectedIdx, true);
    else clearActive();
  }

  /** @param {boolean} [focusTrigger] */
  function close(focusTrigger = false) {
    if (!isOpen()) return;
    wrap.classList.remove("is-open");
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    clearActive();
    if (focusTrigger) trigger.focus();
  }

  /** @param {number} index @param {boolean} [scroll] */
  function setActive(index, scroll = false) {
    if (!optionEls.length) return;
    let i = index;
    if (i < 0) i = optionEls.length - 1;
    if (i >= optionEls.length) i = 0;
    let guard = 0;
    while (optionEls[i]?.classList.contains("is-disabled") && guard < optionEls.length) {
      i = index >= activeIndex ? i + 1 : i - 1;
      if (i >= optionEls.length) i = 0;
      if (i < 0) i = optionEls.length - 1;
      guard += 1;
    }
    activeIndex = i;
    optionEls.forEach((li, n) => {
      li.classList.toggle("is-active", n === i);
    });
    const active = optionEls[i];
    if (active) {
      trigger.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    }
  }

  function onTriggerClick(e) {
    e.preventDefault();
    if (select.disabled) return;
    if (isOpen()) close();
    else open();
  }

  /** @param {KeyboardEvent} e */
  function onTriggerKeydown(e) {
    if (select.disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen()) {
        open();
        if (e.key === "ArrowUp") setActive(optionEls.length - 1, true);
        return;
      }
      if (e.key === "ArrowDown") setActive(activeIndex + 1, true);
      else if (e.key === "ArrowUp") setActive(activeIndex - 1, true);
      else if (e.key === "Enter" || e.key === " ") {
        const li = optionEls[activeIndex];
        if (li && !li.classList.contains("is-disabled")) {
          chooseValue(li.dataset.value || "");
          close(true);
        }
      }
    } else if (e.key === "Escape") {
      if (isOpen()) {
        e.preventDefault();
        close(true);
      }
    } else if (e.key === "Home" && isOpen()) {
      e.preventDefault();
      setActive(0, true);
    } else if (e.key === "End" && isOpen()) {
      e.preventDefault();
      setActive(optionEls.length - 1, true);
    }
  }

  /** @param {MouseEvent} e */
  function onClearClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (select.disabled || !clearBtn) return;
    chooseValue("");
    close(false);
    trigger.focus();
  }

  /** @param {MouseEvent} e */
  function onDocPointer(e) {
    if (!isOpen()) return;
    if (e.target instanceof Node && wrap.contains(e.target)) return;
    close();
  }

  function onSelectChange() {
    syncTriggerLabel();
    syncSelectedInList();
  }

  function onSelectFocus() {
    trigger.focus();
  }

  syncTriggerLabel();
  rebuildList();

  trigger.addEventListener("click", onTriggerClick);
  trigger.addEventListener("keydown", onTriggerKeydown);
  clearBtn?.addEventListener("click", onClearClick);
  select.addEventListener("change", onSelectChange);
  select.addEventListener("focus", onSelectFocus);
  document.addEventListener("pointerdown", onDocPointer);

  return () => {
    close();
    trigger.removeEventListener("click", onTriggerClick);
    trigger.removeEventListener("keydown", onTriggerKeydown);
    clearBtn?.removeEventListener("click", onClearClick);
    select.removeEventListener("change", onSelectChange);
    select.removeEventListener("focus", onSelectFocus);
    document.removeEventListener("pointerdown", onDocPointer);
    select.classList.remove("form-select-native");
    select.removeAttribute("tabindex");
    select.removeAttribute("aria-hidden");
    delete select.dataset.formSelectEnhanced;
    wrap.replaceWith(select);
  };
}
