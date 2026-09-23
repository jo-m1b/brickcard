import {
  ICON_ADD,
  ICON_APPS_2,
  ICON_CALENDAR_TODO,
  ICON_CLOSE,
  ICON_DELETE_BIN_2,
  ICON_HASHTAG,
  ICON_PALETTE,
  ICON_PENCIL,
  ICON_SAVE,
  ICON_SEARCH_LINE,
  ICON_USER_3,
  modalTitleMarkup,
} from "../icons.js";
import { enhanceFormSelect } from "../form-select.js";
import { bindFormImage, formImageMarkup } from "../form-image.js";
import {
  compressImage,
  createId,
  createRebrickableThemeId,
  parseRebrickableSetId,
  upsertCard,
  deleteCard,
  getCard,
  loadThemes,
  getTheme,
} from "../storage.js";
import { mountCardPreview, refreshCardPreview, mountCardBackPreview, refreshCardBackPreview } from "../card-render.js";
import { formatCardImageBasename } from "../card-export.js";
import { confirmDialog, confirmUnsavedClose } from "../confirm-dialog.js";
import { _t } from "../i18n.js";
import { partitionThemes } from "../themes-data.js";
import { themeDisplayMap } from "../sets-presets.js";
import { setAppDocumentTitle } from "../document-title.js";
import { focusTopModal, getTopModal } from "../modal-focus.js";
import {
  REBRICKABLE_HOME_HREF,
  rebrickableLogoLinkMarkup,
  rebrickableOriginMarkup,
  rebrickableSetHref,
  setRebrickableOriginCatalog,
} from "../rebrickable-ref.js";
import { bindSetSearch } from "../set-search.js";
import {
  cardDraftFromRebrickableSet,
  catalogThemePathLabel,
  loadSetsPresets,
  resolveOrCreateThemeFromRebrickable,
} from "../sets-presets.js";
import { toast } from "../toast.js";

/**
 * @param {HTMLElement} host Modal container (#modal-root)
 * @param {{
 *   cardId?: string|null,
 *   onSaved: (subject: string, meta: { isNew: boolean, card: import("../storage.js").Card }) => void,
 *   onCancel: () => void,
 *   onDeleted?: (subject: string, cardId: string) => void,
 *   onThemeChanged?: () => void,
 * }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderEditor(host, opts) {
  const existing = opts.cardId ? await getCard(opts.cardId) : null;
  const isEdit = Boolean(existing);
  let cardId = existing?.id || createId();
  let themes = await loadThemes();
  const storedImageBg = existing?.imageBackgroundColor || "";
  const savedSetId = parseRebrickableSetId(existing?.rebrickableSetId);
  const showCatalogSearch = !savedSetId;
  let originSetId = savedSetId;
  let originThemeId = existing?.rebrickableThemeId ?? null;
  /** @type {import("../themes-data.js").LegoTheme|null} */
  let pendingTheme = null;

  /** @type {{
   *   imageDataUrl: string|null,
   *   imageBackgroundColor: string,
   *   imageZoom: number,
   *   imageOffsetX: number,
   *   imageOffsetY: number,
   *   legoTheme: import("../themes-data.js").LegoTheme|null
   * }} */
  const state = {
    imageDataUrl: existing?.imageDataUrl || null,
    imageBackgroundColor: storedImageBg,
    imageZoom: existing?.imageZoom || 1,
    imageOffsetX: existing?.imageOffsetX || 0,
    imageOffsetY: existing?.imageOffsetY || 0,
    legoTheme: null,
  };

  if (existing?.brickcardThemeId) {
    state.legoTheme =
      themes.find((t) => t.id === existing.brickcardThemeId) ||
      (await getTheme(existing.brickcardThemeId));
  }

  /** Display copy for the card preview (ancestor colors / logo). Not saved. */
  let previewLegoTheme = state.legoTheme;
  let previewSeq = 0;

  async function resolvePreviewTheme() {
    const seq = ++previewSeq;
    const theme = state.legoTheme;
    if (!theme) {
      if (seq !== previewSeq) return;
      previewLegoTheme = null;
      return;
    }
    try {
      const map = await themeDisplayMap([theme]);
      if (seq !== previewSeq) return;
      previewLegoTheme = map.get(theme.id) || theme;
    } catch {
      if (seq !== previewSeq) return;
      previewLegoTheme = theme;
    }
  }

  const previewThemeReady = resolvePreviewTheme();

  const selectedId = existing?.brickcardThemeId || "";
  /** @param {import("../themes-data.js").LegoTheme[]} list @param {string} selected */
  function themeOptionsHtml(list, selected) {
    /** @param {import("../themes-data.js").LegoTheme} t */
    function themeOption(t) {
      return `<option value="${escapeAttr(t.id)}" ${
        selected === t.id ? "selected" : ""
      }>${escapeHtml(t.name)}</option>`;
    }
    const { custom: customThemes, builtin: builtinThemes } = partitionThemes(list);
    return customThemes.length
      ? `<optgroup label="${escapeAttr(_t("Custom themes"))}">${customThemes.map(themeOption).join("")}</optgroup>
                  <optgroup label="${escapeAttr(_t("Default themes"))}">${builtinThemes.map(themeOption).join("")}</optgroup>`
      : builtinThemes.map(themeOption).join("");
  }
  const themeOptions = themeOptionsHtml(themes, selectedId);

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="card-editor-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="editor-title">${modalTitleMarkup(
              editorDialogTitle(existing),
              isEdit ? ICON_PENCIL : ICON_ADD
            )}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-modal-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="editor-layout">
            <aside class="editor-preview-col">
              ${
                savedSetId
                  ? rebrickableOriginMarkup({
                      href: rebrickableSetHref(savedSetId),
                      hintMsgid: "This set is referenced on",
                    })
                  : ""
              }
              <div class="preview-wrap preview-wrap--pair" id="preview-wrap">
              <div class="card-preview" id="preview-host" aria-label="${escapeAttr(_t("Front preview"))}"></div>
              <div class="card-preview" id="preview-back-host" aria-label="${escapeAttr(_t("Back preview"))}"></div>
              </div>
            </aside>
              ${
                showCatalogSearch
                  ? `<div class="editor-catalog-search">
              <div class="form-field">
                <label class="form-label" for="card-set-search">${escapeHtml(
                  _t(
                    isEdit
                      ? "Associate with the catalog database"
                      : "Prefill from the catalog database"
                  )
                )}</label>
                <div class="form-field-with-rebrickable">
                  ${rebrickableLogoLinkMarkup(REBRICKABLE_HOME_HREF)}
                  <div class="search-bar search-bar--suggest" id="card-set-search-bar">
                    <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
                    <input class="form-control" type="search" id="card-set-search" placeholder="${escapeAttr(_t("Search for a set…"))}" autocomplete="off" />
                    <div class="search-bar-trail">
                      <span class="search-num-results" id="card-set-search-num-results" aria-live="polite"></span>
                    </div>
                  </div>
                </div>
              </div>
              </div>`
                  : ""
              }
            <div class="editor-fields">
              <div class="form-field">
                <label class="form-label" for="lego-set-ref">${_t("Set number")}</label>
                <div class="form-control-wrap">
                  <span class="form-control-icon" aria-hidden="true">${ICON_HASHTAG}</span>
                  <input class="form-control" type="text" id="lego-set-ref" autocomplete="off" />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" for="card-title">${_t("Title")}</label>
                <p class="form-hint" id="card-title-hint">${_t("Maximum 3 lines shown on the card (Enter for a line break)")}</p>
                <textarea class="form-control" id="card-title" rows="3" autocomplete="off" aria-describedby="card-title-hint"></textarea>
              </div>

              <div class="field-row field-row-3">
                <div class="form-field">
                  <label class="form-label" for="release-year">${_t("Release year")}</label>
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_CALENDAR_TODO}</span>
                    <input class="form-control" type="number" id="release-year" min="1900" max="2100" step="1" inputmode="numeric" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label" for="num-pieces">${_t("Number of pieces")}</label>
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_APPS_2}</span>
                    <input class="form-control" type="number" id="num-pieces" min="0" step="1" inputmode="numeric" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label" for="num-figurines">${_t("Number of figurines")}</label>
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_USER_3}</span>
                    <input class="form-control" type="number" id="num-figurines" min="0" step="1" inputmode="numeric" />
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" for="brickcard-theme-id">${_t("Theme")}</label>
                <div class="form-field-with-action">
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_PALETTE}</span>
                    <select id="brickcard-theme-id" class="form-control">
                      <option value="">${_t("No theme")}</option>
                      ${themeOptions}
                    </select>
                  </div>
                  <button type="button" class="btn primary" id="btn-theme-action">
                    ${ICON_PALETTE}<span id="btn-theme-action-label">${selectedId ? _t("Customize the theme") : _t("Manage themes")}</span>
                  </button>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" id="card-photo-label">${_t("Image")}</label>
                ${formImageMarkup({
                  id: "card-image",
                  labelledBy: "card-photo-label",
                  dataUrl: existing?.imageDataUrl || "",
                  backgroundColor: storedImageBg,
                  zoom: existing?.imageZoom || 1,
                  offsetX: existing?.imageOffsetX || 0,
                  offsetY: existing?.imageOffsetY || 0,
                })}
              </div>

              <p class="form-error" id="error" role="alert"></p>
            </div>
          </div>
        </div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-card-save">${ICON_SAVE}<span>${_t("Save")}</span></button>
            <button type="button" class="btn secondary sm" id="btn-card-cancel">${_t("Cancel")}</button>
          </div>
          ${
            isEdit
              ? `<div class="modal-footer-start">
            <button type="button" class="btn danger" id="btn-card-delete">${ICON_DELETE_BIN_2}<span>${_t("Delete")}</span></button>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle(editorDialogTitle(existing));

  const refs = {
    backdrop: host.querySelector("#card-editor-backdrop"),
    legoSetRef: host.querySelector("#lego-set-ref"),
    title: host.querySelector("#card-title"),
    releaseYear: host.querySelector("#release-year"),
    numPieces: host.querySelector("#num-pieces"),
    numFigurines: host.querySelector("#num-figurines"),
    brickcardThemeId: host.querySelector("#brickcard-theme-id"),
    themeAction: host.querySelector("#btn-theme-action"),
    themeActionLabel: host.querySelector("#btn-theme-action-label"),
    error: host.querySelector("#error"),
    previewWrap: host.querySelector("#preview-wrap"),
    previewHost: host.querySelector("#preview-host"),
    previewBackHost: host.querySelector("#preview-back-host"),
    save: host.querySelector("#btn-card-save"),
    cancel: host.querySelector("#btn-card-cancel"),
    deleteBtn: host.querySelector("#btn-card-delete"),
    close: host.querySelector("#btn-modal-close"),
  };

  const imageRoot = /** @type {HTMLElement|null} */ (host.querySelector("#card-image"));
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let imageField = null;
  /** @type {(() => void)|null} */
  let destroyThemeSelect = enhanceFormSelect(
    /** @type {HTMLSelectElement} */ (refs.brickcardThemeId)
  );

  const previewDraft = {
    legoSetRef: existing?.legoSetRef || "",
    title: existing?.title || "",
    releaseYear: existing?.releaseYear ?? null,
    numPieces: existing?.numPieces ?? null,
    numFigurines: existing?.numFigurines ?? null,
    imageDataUrl: state.imageDataUrl || "",
    imageBackgroundColor: state.imageBackgroundColor,
    imageZoom: state.imageZoom,
    imageOffsetX: state.imageOffsetX,
    imageOffsetY: state.imageOffsetY,
  };

  await previewThemeReady;

  /** @type {HTMLElement} */
  let previewCard = mountCardPreview(refs.previewHost, previewDraft, {
    legoTheme: previewLegoTheme,
  });

  /** @type {HTMLElement} */
  let previewBack = mountCardBackPreview(refs.previewBackHost, previewDraft, {
    legoTheme: previewLegoTheme,
  });

  if (existing) {
    refs.legoSetRef.value = existing.legoSetRef;
    refs.title.value = existing.title;
    refs.releaseYear.value =
      existing.releaseYear != null ? String(existing.releaseYear) : "";
    refs.numPieces.value =
      existing.numPieces != null ? String(existing.numPieces) : "";
    refs.numFigurines.value =
      existing.numFigurines != null ? String(existing.numFigurines) : "";
  }

  let cancelled = false;
  if (savedSetId) {
    void loadSetsPresets()
      .then((catalog) => {
        if (cancelled) return;
        const set = catalog.sets.get(savedSetId);
        const themeId = set?.themeId ?? originThemeId;
        const theme = themeId ? catalog.themes.get(String(themeId)) : null;
        setRebrickableOriginCatalog(host, {
          path: catalogThemePathLabel(theme, catalog.themes),
          setName: String(set?.name || "").trim(),
        });
      })
      .catch(() => {});
  }

  function draft() {
    const numPiecesVal = refs.numPieces.value.trim();
    const numFigurinesVal = refs.numFigurines.value.trim();
    const releaseYearVal = refs.releaseYear.value.trim();
    return {
      legoSetRef: refs.legoSetRef.value.trim(),
      title: refs.title.value.trim(),
      brickcardThemeId: refs.brickcardThemeId.value,
      numPieces: numPiecesVal === "" ? null : Number(numPiecesVal),
      numFigurines: numFigurinesVal === "" ? null : Number(numFigurinesVal),
      releaseYear: releaseYearVal === "" ? null : Number(releaseYearVal),
      imageDataUrl: state.imageDataUrl || "",
      imageBackgroundColor: state.imageBackgroundColor || "",
      imageZoom: state.imageZoom,
      imageOffsetX: state.imageOffsetX,
      imageOffsetY: state.imageOffsetY,
      rebrickableSetId: originSetId,
      rebrickableThemeId: originThemeId,
    };
  }

  function syncPreview() {
    const data = draft();
    refreshCardPreview(previewCard, data, {
      legoTheme: previewLegoTheme,
    });
    refreshCardBackPreview(previewBack, data, {
      legoTheme: previewLegoTheme,
    });
  }

  async function applyPreviewTheme() {
    await resolvePreviewTheme();
    syncPreview();
  }

  function cardImageBasename() {
    return formatCardImageBasename({
      legoSetRef: refs.legoSetRef.value,
      title: refs.title.value,
      cardId,
    });
  }

  if (imageRoot) {
    imageField = bindFormImage(imageRoot, {
      processFile: compressImage,
      dialogHost: host,
      downloadBasename: cardImageBasename,
      onChange(value) {
        state.imageDataUrl = value.dataUrl || null;
        state.imageBackgroundColor = value.backgroundColor || "";
        state.imageZoom = value.zoom;
        state.imageOffsetX = value.offsetX;
        state.imageOffsetY = value.offsetY;
        syncPreview();
      },
    });
  }

  /**
   * @param {HTMLInputElement|HTMLTextAreaElement} input
   * @param {string|number|null|undefined} value
   * @param {boolean} replaceAll
   */
  function fillIfEmpty(input, value, replaceAll) {
    if (!replaceAll && String(input.value || "").trim()) return;
    input.value = value == null || value === "" ? "" : String(value);
  }

  /**
   * @param {import("../sets-presets.js").CatalogSetMatch} set
   * @returns {import("../themes-data.js").LegoTheme|null}
   */
  function pendingThemeFromSet(set) {
    const id = set.themeId;
    if (!id) return null;
    const name = String(set.themeName || "").trim();
    return {
      id: createRebrickableThemeId(id),
      name: name || String(id),
      color: "",
      secondaryColor: "",
      logoDataUrl: "",
      logoZoom: 1,
      logoOffsetX: 0,
      logoOffsetY: 0,
      isBuiltin: false,
      rebrickableThemeId: id,
      updatedAt: "",
    };
  }

  let applySeq = 0;

  /**
   * @param {import("../sets-presets.js").CatalogSetMatch} set
   */
  async function applyCatalogSet(set) {
    const seq = ++applySeq;
    const replaceAll = !isEdit;
    try {
      const catalogDraft = await cardDraftFromRebrickableSet(set.id);
      if (seq !== applySeq) return;
      originSetId = catalogDraft.rebrickableSetId;
      originThemeId = catalogDraft.rebrickableThemeId;

      fillIfEmpty(refs.legoSetRef, catalogDraft.legoSetRef, replaceAll);
      fillIfEmpty(refs.title, catalogDraft.title, replaceAll);
      fillIfEmpty(refs.releaseYear, catalogDraft.releaseYear, replaceAll);
      fillIfEmpty(refs.numPieces, catalogDraft.numPieces, replaceAll);
      fillIfEmpty(refs.numFigurines, catalogDraft.numFigurines, replaceAll);

      const themeEmpty = !refs.brickcardThemeId.value;
      if (replaceAll || themeEmpty) {
        if (catalogDraft.brickcardThemeId) {
          pendingTheme = null;
          applyThemeSelection(catalogDraft.brickcardThemeId);
        } else {
          pendingTheme = pendingThemeFromSet(set);
          applyThemeSelection(pendingTheme?.id || "");
        }
      }

      const imageEmpty = !state.imageDataUrl;
      if (replaceAll || imageEmpty) {
        const url = catalogDraft.imageDataUrl || "";
        state.imageDataUrl = url || null;
        state.imageBackgroundColor = "";
        state.imageZoom = 1;
        state.imageOffsetX = 0;
        state.imageOffsetY = 0;
        imageField?.setValue({
          dataUrl: url,
          backgroundColor: "",
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
        });
      }

      await applyPreviewTheme();
    } catch (err) {
      if (seq !== applySeq) return;
      console.error(err);
      const msg =
        err && typeof err === "object" && "message" in err && err.message
          ? String(err.message)
          : _t("Loading error");
      toast({ type: "error", message: msg });
    }
  }

  const setSearchBar = /** @type {HTMLElement|null} */ (
    host.querySelector("#card-set-search-bar")
  );
  const unbindSetSearch = setSearchBar
    ? bindSetSearch(setSearchBar, {
        onSelect(set) {
          void applyCatalogSet(set);
        },
      })
    : () => {};

  const initialSnapshot = JSON.stringify(draft());
  function isDirty() {
    return JSON.stringify(draft()) !== initialSnapshot;
  }

  syncPreview();

  ["input", "change"].forEach((evt) => {
    refs.legoSetRef.addEventListener(evt, syncPreview);
    refs.title.addEventListener(evt, syncPreview);
    refs.releaseYear.addEventListener(evt, syncPreview);
    refs.numPieces.addEventListener(evt, syncPreview);
    refs.numFigurines.addEventListener(evt, syncPreview);
  });

  refs.brickcardThemeId.addEventListener("change", () => {
    const id = refs.brickcardThemeId.value;
    state.legoTheme = resolveThemeById(id);
    syncThemeActionButton();
    void applyPreviewTheme();
  });

  function themesWithPending() {
    if (!pendingTheme) return themes;
    if (themes.some((t) => t.id === pendingTheme.id)) return themes;
    return [pendingTheme, ...themes];
  }

  /** @param {string} id */
  function resolveThemeById(id) {
    if (!id) return null;
    return themes.find((t) => t.id === id) || (pendingTheme?.id === id ? pendingTheme : null);
  }

  function isPendingSelected() {
    const id = refs.brickcardThemeId.value;
    if (!pendingTheme || pendingTheme.id !== id) return false;
    return !themes.some((t) => t.id === id);
  }

  function themeActionLabel() {
    const id = refs.brickcardThemeId.value;
    if (id && !isPendingSelected()) return _t("Customize the theme");
    return _t("Manage themes");
  }

  function syncThemeActionButton() {
    if (!refs.themeActionLabel) return;
    refs.themeActionLabel.textContent = themeActionLabel();
  }

  function bindThemeSelect() {
    destroyThemeSelect?.();
    destroyThemeSelect = enhanceFormSelect(
      /** @type {HTMLSelectElement} */ (refs.brickcardThemeId)
    );
  }

  async function refreshThemeField() {
    const keepId = refs.brickcardThemeId.value;
    themes = await loadThemes();
    const list = themesWithPending();
    const still = Boolean(keepId && list.some((t) => t.id === keepId));
    const nextId = still ? keepId : "";
    destroyThemeSelect?.();
    destroyThemeSelect = null;
    refs.brickcardThemeId.innerHTML = `<option value="">${escapeHtml(_t("No theme"))}</option>${themeOptionsHtml(list, nextId)}`;
    refs.brickcardThemeId.value = nextId;
    bindThemeSelect();
    state.legoTheme = resolveThemeById(nextId);
    syncThemeActionButton();
    void applyPreviewTheme();
  }

  /**
   * @param {string} id
   */
  function applyThemeSelection(id) {
    const nextId = id || "";
    destroyThemeSelect?.();
    destroyThemeSelect = null;
    refs.brickcardThemeId.innerHTML = `<option value="">${escapeHtml(_t("No theme"))}</option>${themeOptionsHtml(themesWithPending(), nextId)}`;
    refs.brickcardThemeId.value = nextId;
    bindThemeSelect();
    state.legoTheme = resolveThemeById(nextId);
    syncThemeActionButton();
  }

  function notifyThemeSaved(name, meta) {
    toast({
      type: "success",
      title: meta?.presetOverride ? _t("Customization saved") : _t("Theme saved"),
      message: name,
      icon: "palette",
    });
    opts.onThemeChanged?.();
  }

  function notifyThemeDeleted(name, meta) {
    toast({
      type: "success",
      title: meta?.presetOverride ? _t("Customization removed") : _t("Theme deleted"),
      message: name,
      icon: "delete-bin-2",
    });
    opts.onThemeChanged?.();
  }

  function overlayLoadError(err) {
    console.error(err);
    const msg = err && err.message ? err.message : String(err || _t("Loading error"));
    toast({ type: "error", message: msg });
  }

  /** @type {(() => void)|null} */
  let cleanupStackedThemeEditor = null;
  /** @type {(() => void)|null} */
  let cleanupStackedThemes = null;
  /** @type {typeof import("./themes.js") | null} */
  let stackedThemesMod = null;
  let themeStackBusy = false;

  function disposeStackedThemeEditor() {
    const fn = cleanupStackedThemeEditor;
    cleanupStackedThemeEditor = null;
    if (fn) fn();
  }

  function disposeStackedThemes() {
    disposeStackedThemeEditor();
    const fn = cleanupStackedThemes;
    cleanupStackedThemes = null;
    stackedThemesMod = null;
    if (fn) fn();
  }

  function editorDialogEl() {
    return refs.backdrop?.querySelector(".modal") || null;
  }

  /**
   * @param {string|null} themeId
   */
  async function openStackedThemeEditor(themeId) {
    if (themeStackBusy) return;
    themeStackBusy = true;
    try {
      disposeStackedThemeEditor();
      const themeEditor = await import("./theme-editor.js");
      const listOpen = Boolean(cleanupStackedThemes && stackedThemesMod);
      cleanupStackedThemeEditor = await themeEditor.renderThemeEditor(host, {
        themeId,
        stacked: true,
        onClose: () => {
          disposeStackedThemeEditor();
          if (listOpen && stackedThemesMod) {
            if (themeId) stackedThemesMod.focusThemeInList(themeId);
            stackedThemesMod.applyPendingThemeFocus();
            focusTopModal({ resetScroll: false });
            return;
          }
          void refreshThemeField().then(() => focusTopModal());
        },
        onSaved: (name, meta) => {
          notifyThemeSaved(name, meta);
          if (listOpen && stackedThemesMod) {
            if (meta?.isNew) {
              if (!stackedThemesMod.refreshThemesListAfterCreate(meta.theme)) {
                stackedThemesMod.prepareThemesAfterThemeCreate();
              }
            } else if (!stackedThemesMod.patchThemeInList(meta?.theme)) {
              /* list missing */
            }
            disposeStackedThemeEditor();
            if (meta?.theme?.id) stackedThemesMod.focusThemeInList(meta.theme.id);
            stackedThemesMod.applyPendingThemeFocus();
            focusTopModal({ resetScroll: false });
            return;
          }
          disposeStackedThemeEditor();
          void refreshThemeField().then(() => focusTopModal());
        },
        onDeleted: (name, deletedId, meta) => {
          notifyThemeDeleted(name, meta);
          if (listOpen && stackedThemesMod) {
            stackedThemesMod.removeThemeFromList(deletedId, meta?.restoredPreset);
            disposeStackedThemeEditor();
            focusTopModal({ resetScroll: false });
            return;
          }
          disposeStackedThemeEditor();
          void refreshThemeField().then(() => focusTopModal());
        },
      });
      if (!cleanupStackedThemeEditor) {
        if (!listOpen) await refreshThemeField();
        focusTopModal({ resetScroll: listOpen ? false : true });
        return;
      }
      focusTopModal();
    } catch (err) {
      overlayLoadError(err);
    } finally {
      themeStackBusy = false;
    }
  }

  async function openStackedThemesList() {
    if (themeStackBusy || cleanupStackedThemes) return;
    themeStackBusy = true;
    try {
      stackedThemesMod = await import("./themes.js");
      cleanupStackedThemes = await stackedThemesMod.renderThemesModal(host, {
        stacked: true,
        onClose: () => {
          disposeStackedThemes();
          void refreshThemeField().then(() => focusTopModal());
        },
        onCreate: () => {
          void openStackedThemeEditor(null);
        },
        onEdit: (id) => {
          void openStackedThemeEditor(id);
        },
        onClearedCustomThemes: () => {
          toast({
            type: "success",
            message: _t("All custom themes have been deleted"),
            icon: "delete-bin-2",
          });
          opts.onThemeChanged?.();
        },
      });
      focusTopModal();
    } catch (err) {
      overlayLoadError(err);
      stackedThemesMod = null;
    } finally {
      themeStackBusy = false;
    }
  }

  refs.themeAction?.addEventListener("click", () => {
    const id = refs.brickcardThemeId.value;
    if (id && !isPendingSelected()) void openStackedThemeEditor(id);
    else void openStackedThemesList();
  });

  window.addEventListener("resize", syncPreview);

  const previewFlipMq = window.matchMedia("(max-width: 549px)");
  const previewWrap = /** @type {HTMLElement|null} */ (refs.previewWrap);

  function previewFlipAria() {
    if (!previewWrap) return;
    if (!previewFlipMq.matches) {
      previewWrap.removeAttribute("role");
      previewWrap.removeAttribute("tabindex");
      previewWrap.removeAttribute("aria-label");
      return;
    }
    previewWrap.setAttribute("role", "button");
    previewWrap.setAttribute("tabindex", "0");
    previewWrap.setAttribute(
      "aria-label",
      previewWrap.classList.contains("is-showing-back")
        ? _t("Back preview, click to see the front")
        : _t("Front preview, click to see the back")
    );
  }

  function togglePreviewSide() {
    if (!previewWrap || !previewFlipMq.matches) return;
    previewWrap.classList.toggle("is-showing-back");
    previewFlipAria();
  }

  function onPreviewWrapClick(e) {
    if (e.target instanceof Element && e.target.closest("a, .theme-rebrickable-ref")) {
      return;
    }
    togglePreviewSide();
  }

  function onPreviewWrapKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    togglePreviewSide();
  }

  if (previewWrap) {
    previewWrap.addEventListener("click", onPreviewWrapClick);
    previewWrap.addEventListener("keydown", onPreviewWrapKeydown);
    previewFlipMq.addEventListener("change", previewFlipAria);
    previewFlipAria();
  }

  let closeBusy = false;

  async function saveCard() {
    const data = draft();
    refs.error.textContent = "";
    refs.save.disabled = true;
    try {
      let brickcardThemeId = data.brickcardThemeId;
      if (isPendingSelected() && pendingTheme?.rebrickableThemeId) {
        const created = await resolveOrCreateThemeFromRebrickable(
          pendingTheme.rebrickableThemeId
        );
        brickcardThemeId = created.id;
        pendingTheme = null;
        themes = await loadThemes();
      }
      const saved = await upsertCard({
        ...data,
        brickcardThemeId,
        id: cardId,
        rebrickableSetId: originSetId,
        rebrickableThemeId: originThemeId,
      });
      opts.onSaved(cardToastSubject(), { isNew: !isEdit, card: saved });
      return true;
    } catch (err) {
      refs.error.textContent = err.message || _t("Unable to save.");
      refs.save.disabled = false;
      return false;
    }
  }

  async function requestClose(optsClose = {}) {
    if (optsClose.skipConfirm) {
      opts.onCancel();
      return;
    }
    if (closeBusy) return;
    closeBusy = true;
    try {
      const result = await confirmUnsavedClose(host, { isDirty, save: saveCard });
      if (result === "stay" || result === "saved") return;
      opts.onCancel();
    } finally {
      closeBusy = false;
    }
  }

  refs.cancel.addEventListener("click", () => requestClose({ skipConfirm: true }));
  refs.close.addEventListener("click", requestClose);

  refs.backdrop.addEventListener("click", (e) => {
    if (e.target !== refs.backdrop) return;
    if (getTopModal() !== editorDialogEl()) return;
    requestClose();
  });

  function cardToastSubject() {
    const data = draft();
    const title = data.title.replace(/\s*\n\s*/g, " ").trim();
    const ref = data.legoSetRef.replace(/^#+\s*/, "").trim();
    if (title && ref) return `${title} (#${ref})`;
    if (title) return title;
    if (ref) return `#${ref}`;
    return "";
  }

  function cardDeleteTitle() {
    const subject = cardToastSubject();
    if (subject) return _t("Delete the card “%(subject)s”?", { subject });
    return _t("Delete this card?");
  }

  function onKeydown(e) {
    if (e.key !== "Escape") return;
    if (getTopModal() !== editorDialogEl()) return;
    e.preventDefault();
    requestClose();
  }
  window.addEventListener("keydown", onKeydown);

  refs.save.addEventListener("click", () => {
    saveCard();
  });

  if (refs.deleteBtn && existing) {
    refs.deleteBtn.addEventListener("click", async () => {
      const ok = await confirmDialog(host, {
        title: cardDeleteTitle(),
        icon: "delete-bin-2",
        message: _t(
          "Warning, deletion is permanent and cannot be undone! Do you want to continue?"
        ),
        okLabel: _t("Delete"),
        danger: true,
      });
      if (!ok) return;
      refs.deleteBtn.disabled = true;
      refs.save.disabled = true;
      try {
        await deleteCard(existing.id);
        if (opts.onDeleted) opts.onDeleted(cardToastSubject(), existing.id);
        else opts.onCancel();
      } catch (err) {
        refs.error.textContent = err.message || _t("Unable to delete.");
        refs.deleteBtn.disabled = false;
        refs.save.disabled = false;
      }
    });
  }

  return () => {
    cancelled = true;
    unbindSetSearch();
    disposeStackedThemes();
    destroyThemeSelect?.();
    imageField?.destroy();
    window.removeEventListener("resize", syncPreview);
    window.removeEventListener("keydown", onKeydown);
    if (previewWrap) {
      previewWrap.removeEventListener("click", onPreviewWrapClick);
      previewWrap.removeEventListener("keydown", onPreviewWrapKeydown);
      previewFlipMq.removeEventListener("change", previewFlipAria);
    }
  };
}

/**
 * Edit dialog title (values at open).
 * @param {{ title?: string, legoSetRef?: string }|null} existing
 */
function editorDialogTitle(existing) {
  if (!existing) return _t("New card");
  const title = String(existing.title || "").replace(/\s*\n\s*/g, " ").trim();
  const refRaw = String(existing.legoSetRef || "").replace(/^#+\s*/, "").trim();
  if (title && refRaw) return _t("Edit “%(title)s” (#%(ref)s)", { title, ref: refRaw });
  if (title) return _t("Edit “%(title)s”", { title });
  if (refRaw) return _t("Edit “#%(ref)s”", { ref: refRaw });
  return _t("Edit card");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}
