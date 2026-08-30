/**
 * Checkbox (design system): `form-check` (box to the left of the label / hint).
 * Read-only via `aria-readonly` (the HTML `readonly` attribute is ignored
 * by native checkboxes) — `bindFormCheckboxes()` blocks the toggle.
 */

/**
 * Markup for a checkbox (`label.form-check`).
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
export function formCheckboxMarkup(opts) {
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

  const classes = ["form-check"];
  if (sm) classes.push("sm");

  const hintHtml = hint
    ? `<span class="form-hint" id="${escapeAttr(hintId)}">${escapeHtml(hint)}</span>`
    : "";

  const attrs = [
    `class="form-check-input visually-hidden"`,
    `type="checkbox"`,
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
 * Prevents toggling read-only checkboxes (`aria-readonly="true"`).
 * @param {ParentNode} root
 * @returns {() => void}
 */
export function bindFormCheckboxes(root) {
  const inputs = root.querySelectorAll(
    '.form-check-input[type="checkbox"][aria-readonly="true"]'
  );
  /** @type {(() => void)[]} */
  const unbind = [];

  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) continue;

    /** @param {Event} e */
    const onClick = (e) => {
      e.preventDefault();
    };

    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === " " || e.key === "Enter") e.preventDefault();
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
