# Translation System (i18n)

English is the source (`_t('…')`). `en` has no `.po`. Catalogs are gettext. There is no compiler. [Poedit](https://poedit.net/) is fine.

## Adding a New Language

### 1. Copy a catalog

English has no `.po`. Copy an existing catalog, e.g. French:

```bash
cp src/i18n/fr.po src/i18n/xx.po
```

### 2. Edit the header

Keep `Project-Id-Version: brickcard`. Set `Language` to the ISO 639-1 code:

```po
msgid ""
msgstr ""
"Project-Id-Version: brickcard\n"
"Language: xx\n"
"Content-Type: text/plain; charset=UTF-8\n"
```

### 3. Translate `msgstr` only

Leave every `msgid` as-is. Keep `%(name)s` placeholders and `\n` line breaks.

### 4. Register the locale

Add an entry in [`locales.json`](locales.json). `name` is the language name in that language:

```json
{ "code": "xx", "name": "…" }
```

### 5. Translate About

Copy [`../data/page-about.md`](../data/page-about.md) to `src/data/page-about.xx.md`. The first `#` heading is the dialog title.

### 6. Done

No rebuild. Serve `src/`, then Settings → Language (the app reloads). The new language appears in the selector.

---

## Translation File Structure

`.po` catalog (`src/i18n/xx.po`):

```po
msgid ""
msgstr ""
"Project-Id-Version: brickcard\n"
"Language: xx\n"
"Content-Type: text/plain; charset=UTF-8\n"

msgid "Save"
msgstr "…"

msgid "%(count)s card"
msgstr "%(count)s …"

msgid "%(count)s cards"
msgstr "%(count)s …"
```

Locale list ([`locales.json`](locales.json)):

```json
[
  { "code": "de", "name": "Deutsch" },
  { "code": "en", "name": "English" }
]
```

About pages: `src/data/page-about.md` (English) and `src/data/page-about.{{locale}}.md` (fallback = English).

## Language Codes (ISO 639-1)

Brickcard currently ships **de**, **en**, **es**, **fr**, **it**, **pt**.

| Code | Language | In Brickcard |
|------|----------|--------------|
| pl | Polski | |
| en | English | yes |
| de | Deutsch | yes |
| es | Español | yes |
| fr | Français | yes |
| it | Italiano | yes |
| pt | Português | yes |
| uk | Українська | |
| cs | Čeština | |
| sk | Slovenčina | |
| ru | Русский | |
| nl | Nederlands | |
| sv | Svenska | |
| no | Norsk | |
| da | Dansk | |
| fi | Suomi | |
| ja | 日本語 | |
| ko | 한국어 | |
| zh | 中文 | |

## Rules

- Do not translate **Brickcard** or **LEGO®**.
- `#developer/…` copy stays English (no `.po`).
- An empty `msgstr` falls back to the English `msgid`.
- No `msgctxt` or plural forms — the [parser](../js/i18n.js) ignores them. Use two `msgid`s instead (`%(count)s card` / `%(count)s cards`).

## Placeholders

Some strings use `%(name)s` (not `{{name}}`):

- `%(name)s` — a name
- `%(count)s` — a count
- `%(n)s` — a size or number

Example in a catalog:

```po
msgid "Storage error: %(message)s"
msgstr "… %(message)s"
```

In JS:

```js
_t("Storage error: %(message)s", { message: "…" });
```
