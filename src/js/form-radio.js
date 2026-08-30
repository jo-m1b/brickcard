/**
 * Radio (design system): `form-check form-radio` (circle to the left of the
 * label / hint). Same idea as the checkbox; exclusive selection
 * via `name`. Read-only via `aria-readonly` (the HTML `readonly` attribute
 * is ignored by native radios) — `bindFormRadios()` blocks the choice.
 */

/**
 * Markup for a radio (`label.form-check.form-radio`).
 * @param {{
 *   id: string,
 *   name?: string,
 *   label: string,
 *   hint?: string,
 *   value?: string,
 *   checked?: boolean,
 *   disabled?: boolean,
 *   readonly?: boolean,
 *   sm?: boolean,
 *   describedBy?: string,
 * }} opts
 * @returns {string}
 */
export function formRadioMarkup(opts) {
  const id = opts.id;
  const name = opts.name || id;
  const label = opts.label || "";
  const hint = opts.hint || "";
  const value = opts.value;
  const checked = Boolean(opts.checked);
  const disabled = Boolean(opts.disabled);
  const readonly = Boolean(opts.readonly);
  const sm = Boolean(opts.sm);

  const hintId = hint ? `${id}-hint` : "";
  const described = opts.describedBy || "";

  const classes = ["form-check", "form-radio"];
  if (sm) classes.push("sm");

  const hintHtml = hint
    ? `<span class="form-hint" id="${escapeAttr(hintId)}">${escapeHtml(hint)}</span>`
    : "";

  const attrs = [
    `class="form-check-input visually-hidden"`,
    `type="radio"`,
    `id="${escapeAttr(id)}"`,
    `name="${escapeAttr(name)}"`,
  ];
  if (value != null && value !== "") attrs.push(`value="${escapeAttr(value)}"`);
  if (checked) attrs.push("checked");
  if (disabled) attrs.push("disabled");
  if (readonly) attrs.push(`aria-readonly="true"`);
  if (described) attrs.push(`aria-describedby="${escapeAttr(described)}"`);

  return `<label class="${classes.join(" ")}"><input ${attrs.join(" ")} /><span class="form-check-ui" aria-hidden="true"></span><span class="form-check-text"><span class="form-label">${escapeHtml(label)}</span>${hintHtml}</span></label>`;
}

/**
 * Prevents changing read-only radios (`aria-readonly="true"`),
 * including selecting another option of the same `name` if the checked
 * option is frozen.
 * @param {ParentNode} root
 * @returns {() => void}
 */
export function bindFormRadios(root) {
  const inputs = root.querySelectorAll('.form-check-input[type="radio"]');
  /** @type {(() => void)[]} */
  const unbind = [];

  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) continue;

    /** @param {Event} e */
    const onClick = (e) => {
      if (isRadioChoiceLocked(input, root)) e.preventDefault();
    };

    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (!isChoiceKey(e.key)) return;
      if (isRadioChoiceLocked(input, root)) e.preventDefault();
    };

    input.addEventListener("click", onClick);
    input.addEventListener("keydown", onKey);
    unbind.push(() => {
      input.removeEventListener("click", onClick);
      input.removeEventListener("keydown", onKey);
    });
  }

  return () => {
    unbind.forEach((fn) => fn());
  };
}

/**
 * @param {HTMLInputElement} input
 * @param {ParentNode} root
 * @returns {boolean}
 */
function isRadioChoiceLocked(input, root) {
  if (input.getAttribute("aria-readonly") === "true") return true;
  const name = input.name;
  if (!name) return false;
  const group = root.querySelectorAll(
    `.form-check-input[type="radio"][name="${CSS.escape(name)}"]`
  );
  for (const el of group) {
    if (
      el instanceof HTMLInputElement &&
      el.checked &&
      el.getAttribute("aria-readonly") === "true"
    ) {
      return true;
    }
  }
  return false;
}

/** @param {string} key */
function isChoiceKey(key) {
  return (
    key === " " ||
    key === "Enter" ||
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "ArrowLeft" ||
    key === "ArrowRight"
  );
}

/** @param {string} s */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
