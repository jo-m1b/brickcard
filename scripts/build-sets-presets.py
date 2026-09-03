#!/usr/bin/env python3
"""Compile Rebrickable set dumps into src/data/sets-presets.json."""

from __future__ import annotations

import argparse
import csv
import gzip
import io
import json
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DOWNLOAD_BASE = "https://cdn.rebrickable.com/media/downloads"
SOURCE_URL = "https://rebrickable.com/downloads/"
USER_AGENT = "Brickcard/sets-presets (+https://brickcard.org)"
DOWNLOAD_TIMEOUT_S = 120
# Rebrickable “Database Sets” — not physical boxed sets
DEFAULT_EXCLUDE_THEME_IDS = (746,)
THEME_KEYS = ("id", "name")
SET_KEYS = (
    "id",
    "name",
    "pieceCount",
    "figurineCount",
    "releaseYear",
    "themeId",
    "brickcardThemeId",
)

CSV_FILES = (
    "themes.csv.gz",
    "sets.csv.gz",
    "inventories.csv.gz",
    "inventory_minifigs.csv.gz",
)


def log(message: str) -> None:
    print(message, file=sys.stderr)


def parse_optional_int(raw: object) -> int | None:
    text = str(raw if raw is not None else "").strip()
    if text == "":
        return None
    try:
        return int(text)
    except ValueError:
        return None


def parse_rebrickable_theme_id(raw: object) -> int | None:
    value = parse_optional_int(raw)
    if value is None or value < 1:
        return None
    return value


def download_csv_rows(filename: str) -> list[dict[str, str]]:
    url = f"{DOWNLOAD_BASE}/{filename}"
    log(f"Downloading {url}")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=DOWNLOAD_TIMEOUT_S) as response:
            raw = response.read()
    except urllib.error.URLError as exc:
        raise SystemExit(f"Failed to download {url}: {exc}") from exc
    with gzip.GzipFile(fileobj=io.BytesIO(raw)) as gz:
        text = gz.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(text)))


def load_brickcard_theme_map(path: Path) -> dict[int, str]:
    if not path.is_file():
        log(f"No themes presets at {path}; brickcardThemeId will be omitted")
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Unable to read {path}: {exc}") from exc
    themes = data if isinstance(data, list) else data.get("themes")
    if not isinstance(themes, list):
        raise SystemExit(f"{path}: missing or invalid \"themes\" array")
    mapping: dict[int, str] = {}
    for entry in themes:
        if not isinstance(entry, dict):
            continue
        brickcard_id = str(entry.get("id") or "").strip()
        rebrickable_id = parse_rebrickable_theme_id(entry.get("rebrickableThemeId"))
        if brickcard_id and rebrickable_id is not None:
            mapping[rebrickable_id] = brickcard_id
    return mapping


def theme_parent_map(rows: list[dict[str, str]]) -> tuple[dict[int, str], dict[int, int]]:
    names: dict[int, str] = {}
    parents: dict[int, int] = {}
    for row in rows:
        theme_id = parse_optional_int(row.get("id"))
        if theme_id is None:
            continue
        names[theme_id] = str(row.get("name") or "").strip()
        parent_id = parse_optional_int(row.get("parent_id"))
        if parent_id is not None:
            parents[theme_id] = parent_id
    return names, parents


def excluded_theme_ids(roots: set[int], parents: dict[int, int]) -> set[int]:
    """Exclude each given theme and every descendant (sets they contain)."""
    children: dict[int, list[int]] = defaultdict(list)
    for child_id, parent_id in parents.items():
        children[parent_id].append(child_id)
    excluded: set[int] = set()
    stack = list(roots)
    while stack:
        current = stack.pop()
        if current in excluded:
            continue
        excluded.add(current)
        stack.extend(children.get(current, ()))
    return excluded


def resolve_brickcard_theme_id(
    theme_id: int | None,
    parents: dict[int, int],
    brickcard_by_rebrickable: dict[int, str],
) -> str | None:
    current = theme_id
    seen: set[int] = set()
    while current is not None and current not in seen:
        seen.add(current)
        match = brickcard_by_rebrickable.get(current)
        if match:
            return match
        current = parents.get(current)
    return None


def latest_inventory_ids(rows: list[dict[str, str]]) -> dict[str, int]:
    best: dict[str, tuple[int, int]] = {}
    for row in rows:
        set_num = str(row.get("set_num") or "").strip()
        inventory_id = parse_optional_int(row.get("id"))
        version = parse_optional_int(row.get("version"))
        if not set_num or inventory_id is None or version is None:
            continue
        previous = best.get(set_num)
        if previous is None or version > previous[0]:
            best[set_num] = (version, inventory_id)
    return {set_num: inventory_id for set_num, (_version, inventory_id) in best.items()}


def figurine_counts_by_inventory(rows: list[dict[str, str]]) -> dict[int, int]:
    counts: dict[int, int] = defaultdict(int)
    for row in rows:
        inventory_id = parse_optional_int(row.get("inventory_id"))
        quantity = parse_optional_int(row.get("quantity"))
        if inventory_id is None or quantity is None:
            continue
        counts[inventory_id] += quantity
    return counts


def filter_active(min_value: int | None, max_value: int | None) -> bool:
    return min_value is not None or max_value is not None


def passes_range(value: int | None, min_value: int | None, max_value: int | None) -> bool:
    if not filter_active(min_value, max_value):
        return True
    if value is None:
        return False
    if min_value is not None and value < min_value:
        return False
    if max_value is not None and value > max_value:
        return False
    return True


def resolve_path(raw: str) -> Path:
    path = Path(raw)
    if not path.is_absolute():
        path = REPO_ROOT / path
    return path.resolve()


def load_existing_payload(path: Path) -> dict | None:
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def trim_trailing_none(values: list) -> list:
    while values and values[-1] is None:
        values.pop()
    return values


def set_row(
    *,
    set_id: str,
    name: str,
    piece_count: int | None,
    figurine_count: int,
    release_year: int | None,
    theme_id: int | None,
    brickcard_theme_id: str | None,
) -> list:
    return trim_trailing_none(
        [
            set_id,
            name,
            piece_count or None,
            figurine_count or None,
            release_year or None,
            theme_id,
            brickcard_theme_id or None,
        ]
    )


def encode_json(meta: dict, themes: list[list], sets: list[list]) -> str:
    lines = ["{"]
    lines.append('  "meta": {')
    lines.append(f'    "generatedAt": {json.dumps(meta["generatedAt"])},')
    lines.append(f'    "source": {json.dumps(meta["source"])},')
    lines.append(f'    "themesCount": {meta["themesCount"]},')
    lines.append(f'    "setsCount": {meta["setsCount"]},')
    lines.append(f'    "themeKeys": {json.dumps(list(THEME_KEYS))},')
    lines.append(f'    "setKeys": {json.dumps(list(SET_KEYS))}')
    lines.append("  },")
    lines.append('  "themes": [')
    for index, theme in enumerate(themes):
        comma = "," if index < len(themes) - 1 else ""
        lines.append(f"    {json.dumps(theme, ensure_ascii=False, separators=(',', ':'))}{comma}")
    lines.append("  ],")
    lines.append('  "sets": [')
    for index, entry in enumerate(sets):
        comma = "," if index < len(sets) - 1 else ""
        lines.append(f"    {json.dumps(entry, ensure_ascii=False, separators=(',', ':'))}{comma}")
    lines.append("  ]")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download Rebrickable set dumps and compile src/data/sets-presets.json."
    )
    parser.add_argument(
        "--output",
        default="src/data/sets-presets.json",
        help="Destination JSON path (default: src/data/sets-presets.json)",
    )
    parser.add_argument(
        "--themes-presets",
        default="src/data/themes-presets.json",
        help="Brickcard themes-presets.json for rebrickableThemeId mapping",
    )
    parser.add_argument(
        "--min-piece-count",
        type=int,
        default=10,
        help="Minimum pieceCount (default: 10; use 0 to keep empty sets)",
    )
    parser.add_argument("--max-piece-count", type=int, default=None)
    parser.add_argument("--min-release-year", type=int, default=None)
    parser.add_argument("--max-release-year", type=int, default=None)
    parser.add_argument("--min-figurine-count", type=int, default=None)
    parser.add_argument("--max-figurine-count", type=int, default=None)
    parser.add_argument(
        "--exclude-theme-id",
        dest="exclude_theme_ids",
        type=int,
        action="append",
        default=None,
        metavar="ID",
        help=(
            "Exclude a Rebrickable theme id and all sets in that theme "
            "(including child themes). Repeatable. Default: 746 (Database Sets)"
        ),
    )
    return parser.parse_args(argv)


def build_catalog(args: argparse.Namespace) -> tuple[list[list], list[list]]:
    rows = {name: download_csv_rows(name) for name in CSV_FILES}
    theme_names, theme_parents = theme_parent_map(rows["themes.csv.gz"])
    exclude_roots = (
        set(args.exclude_theme_ids)
        if args.exclude_theme_ids is not None
        else set(DEFAULT_EXCLUDE_THEME_IDS)
    )
    exclude_roots.discard(0)
    excluded = excluded_theme_ids(exclude_roots, theme_parents)
    if excluded:
        log(
            "Excluding theme id(s) "
            + ", ".join(str(i) for i in sorted(exclude_roots))
            + f" ({len(excluded)} theme(s) with descendants)"
        )
    brickcard_by_rebrickable = load_brickcard_theme_map(resolve_path(args.themes_presets))
    inventory_by_set = latest_inventory_ids(rows["inventories.csv.gz"])
    figs_by_inventory = figurine_counts_by_inventory(rows["inventory_minifigs.csv.gz"])

    sets: list[list] = []
    used_theme_ids: set[int] = set()

    for row in rows["sets.csv.gz"]:
        set_num = str(row.get("set_num") or "").strip()
        name = str(row.get("name") or "").strip()
        if not set_num:
            continue
        piece_count = parse_optional_int(row.get("num_parts"))
        release_year = parse_optional_int(row.get("year"))
        theme_id = parse_optional_int(row.get("theme_id"))
        if theme_id is not None and theme_id in excluded:
            continue
        inventory_id = inventory_by_set.get(set_num)
        figurine_count = figs_by_inventory.get(inventory_id, 0) if inventory_id is not None else 0

        if not passes_range(piece_count, args.min_piece_count, args.max_piece_count):
            continue
        if not passes_range(release_year, args.min_release_year, args.max_release_year):
            continue
        if not passes_range(figurine_count, args.min_figurine_count, args.max_figurine_count):
            continue

        brickcard_theme_id = resolve_brickcard_theme_id(
            theme_id, theme_parents, brickcard_by_rebrickable
        )
        if theme_id is not None:
            used_theme_ids.add(theme_id)
        sets.append(
            set_row(
                set_id=set_num,
                name=name,
                piece_count=piece_count,
                figurine_count=figurine_count,
                release_year=release_year,
                theme_id=theme_id,
                brickcard_theme_id=brickcard_theme_id,
            )
        )

    sets.sort(
        key=lambda entry: (
            str(entry[0] if entry else ""),
            entry[4] if len(entry) > 4 and entry[4] is not None else 0,
            str(entry[1] if len(entry) > 1 else ""),
        )
    )
    themes = [
        [theme_id, name]
        for theme_id in sorted(used_theme_ids)
        if (name := theme_names.get(theme_id, ""))
    ]
    return themes, sets


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    output_path = resolve_path(args.output)
    themes, sets = build_catalog(args)
    existing = load_existing_payload(output_path)
    if existing and existing.get("themes") == themes and existing.get("sets") == sets:
        log(f"Unchanged ({len(sets)} sets, {len(themes)} themes) — {output_path}")
        return 0

    meta = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": SOURCE_URL,
        "themesCount": len(themes),
        "setsCount": len(sets),
        "themeKeys": list(THEME_KEYS),
        "setKeys": list(SET_KEYS),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_name(f".{output_path.name}.tmp")
    tmp_path.write_text(encode_json(meta, themes, sets), encoding="utf-8")
    tmp_path.replace(output_path)
    log(f"Wrote {len(sets)} sets, {len(themes)} themes — {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
