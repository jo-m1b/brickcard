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
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

REPO_ROOT = Path(__file__).resolve().parent.parent
DOWNLOAD_BASE = "https://cdn.rebrickable.com/media/downloads"
SOURCE_URL = "https://rebrickable.com/downloads/"
USER_AGENT = "Brickcard/sets-presets (+https://brickcard.org)"
DOWNLOAD_TIMEOUT_S = 120
# Rebrickable “Database Sets” — not physical boxed sets
DEFAULT_EXCLUDE_THEME_IDS = (746,)
THEMES_KEYS = ("id", "name")
SETS_KEYS = (
    "id",
    "name",
    "numPieces",
    "numFigurines",
    "releaseYear",
    "themeId",
)
SETS_IMAGE_URL_PLACEHOLDER = "{id}"
SETS_IMAGE_URL_WARNING_EXAMPLES = 10

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


def num_figurines_by_inventory(rows: list[dict[str, str]]) -> dict[int, int]:
    nums: dict[int, int] = defaultdict(int)
    for row in rows:
        inventory_id = parse_optional_int(row.get("inventory_id"))
        quantity = parse_optional_int(row.get("quantity"))
        if inventory_id is None or quantity is None:
            continue
        nums[inventory_id] += quantity
    return nums


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


def image_url_template(img_url: str, set_id: str) -> str | None:
    """Turn a set img_url into a template if the filename stem is set_id.lower()."""
    url = str(img_url or "").strip()
    token = set_id.lower()
    if not url or not token:
        return None
    parts = urlsplit(url)
    path = parts.path
    if "/" in path:
        dir_path, filename = path.rsplit("/", 1)
        dir_path += "/"
    else:
        dir_path, filename = "", path
    stem, dot, ext = filename.rpartition(".")
    if not dot or stem != token:
        return None
    new_path = f"{dir_path}{SETS_IMAGE_URL_PLACEHOLDER}.{ext}"
    return urlunsplit((parts.scheme, parts.netloc, new_path, parts.query, parts.fragment))


class ImageUrlScan:
    """Collect img_url templates from kept sets (most common wins)."""

    def __init__(self) -> None:
        self.template_counts: Counter[str] = Counter()
        self.empty_count = 0
        self.off_schema: list[tuple[str, str]] = []
        self.valid: list[tuple[str, str, str]] = []

    def add(self, set_num: str, img_url: object) -> None:
        url = str(img_url or "").strip()
        if not url:
            self.empty_count += 1
            return
        template = image_url_template(url, set_num)
        if template is None:
            self.off_schema.append((set_num, url))
            return
        self.template_counts[template] += 1
        self.valid.append((set_num, url, template))


def existing_sets_image_url(existing_meta: object) -> str | None:
    if not isinstance(existing_meta, dict):
        return None
    raw = existing_meta.get("setsImageUrl")
    if not isinstance(raw, str):
        return None
    text = raw.strip()
    return text or None


def resolve_sets_image_url(scan: ImageUrlScan, existing_template: str | None) -> str | None:
    """Pick the most used template; warn on stderr; never fail the build."""
    if scan.empty_count:
        log(f"WARNING: {scan.empty_count} kept set(s) have an empty img_url")
    if not scan.template_counts:
        if existing_template:
            log(
                "WARNING: no usable set img_url — keeping existing setsImageUrl "
                + existing_template
            )
            return existing_template
        log("WARNING: no usable set img_url — omitting setsImageUrl")
        return None
    winner = min(scan.template_counts, key=lambda t: (-scan.template_counts[t], t))
    minority = [(set_num, url) for set_num, url, template in scan.valid if template != winner]
    outliers = scan.off_schema + minority
    if outliers:
        log(
            f"WARNING: {len(outliers)} set image URL(s) do not match "
            f"{winner}"
        )
        for set_num, url in outliers[:SETS_IMAGE_URL_WARNING_EXAMPLES]:
            log(f"  {set_num}: {url}")
        extra = len(outliers) - SETS_IMAGE_URL_WARNING_EXAMPLES
        if extra > 0:
            log(f"  … {extra} more")
    return winner


def trim_trailing_none(values: list) -> list:
    while values and values[-1] is None:
        values.pop()
    return values


def set_row(
    *,
    set_id: str,
    name: str,
    num_pieces: int | None,
    num_figurines: int,
    release_year: int | None,
    theme_id: int | None,
) -> list:
    return trim_trailing_none(
        [
            set_id,
            name,
            num_pieces or None,
            num_figurines or None,
            release_year or None,
            theme_id,
        ]
    )


def encode_json(meta: dict, themes: list[list], sets: list[list]) -> str:
    lines = ["{"]
    lines.append('  "meta": {')
    lines.append(f'    "generatedAt": {json.dumps(meta["generatedAt"])},')
    lines.append(f'    "source": {json.dumps(meta["source"])},')
    lines.append(f'    "numThemes": {meta["numThemes"]},')
    lines.append(f'    "themesKeys": {json.dumps(list(THEMES_KEYS))},')
    lines.append(f'    "numSets": {meta["numSets"]},')
    lines.append(f'    "setsKeys": {json.dumps(list(SETS_KEYS))}')
    sets_image_url = meta.get("setsImageUrl")
    if sets_image_url:
        lines[-1] += ","
        lines.append(f'    "setsImageUrl": {json.dumps(sets_image_url)}')
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
        "--min-num-pieces",
        type=int,
        default=10,
        help="Minimum numPieces (default: 10; use 0 to keep empty sets)",
    )
    parser.add_argument("--max-num-pieces", type=int, default=None)
    parser.add_argument("--min-release-year", type=int, default=None)
    parser.add_argument("--max-release-year", type=int, default=None)
    parser.add_argument("--min-num-figurines", type=int, default=None)
    parser.add_argument("--max-num-figurines", type=int, default=None)
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


def build_catalog(args: argparse.Namespace) -> tuple[list[list], list[list], ImageUrlScan]:
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
    inventory_by_set = latest_inventory_ids(rows["inventories.csv.gz"])
    figs_by_inventory = num_figurines_by_inventory(rows["inventory_minifigs.csv.gz"])

    sets: list[list] = []
    used_theme_ids: set[int] = set()
    image_scan = ImageUrlScan()

    for row in rows["sets.csv.gz"]:
        set_num = str(row.get("set_num") or "").strip()
        name = str(row.get("name") or "").strip()
        if not set_num:
            continue
        num_pieces = parse_optional_int(row.get("num_parts"))
        release_year = parse_optional_int(row.get("year"))
        theme_id = parse_optional_int(row.get("theme_id"))
        if theme_id is not None and theme_id in excluded:
            continue
        inventory_id = inventory_by_set.get(set_num)
        num_figurines = figs_by_inventory.get(inventory_id, 0) if inventory_id is not None else 0

        if not passes_range(num_pieces, args.min_num_pieces, args.max_num_pieces):
            continue
        if not passes_range(release_year, args.min_release_year, args.max_release_year):
            continue
        if not passes_range(num_figurines, args.min_num_figurines, args.max_num_figurines):
            continue

        if theme_id is not None:
            used_theme_ids.add(theme_id)
        image_scan.add(set_num, row.get("img_url"))
        sets.append(
            set_row(
                set_id=set_num,
                name=name,
                num_pieces=num_pieces,
                num_figurines=num_figurines,
                release_year=release_year,
                theme_id=theme_id,
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
    return themes, sets, image_scan


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    output_path = resolve_path(args.output)
    themes, sets, image_scan = build_catalog(args)
    existing = load_existing_payload(output_path)
    existing_meta = existing.get("meta") if existing else None
    sets_image_url = resolve_sets_image_url(image_scan, existing_sets_image_url(existing_meta))
    same_schema = (
        isinstance(existing_meta, dict)
        and existing_meta.get("themesKeys") == list(THEMES_KEYS)
        and existing_meta.get("setsKeys") == list(SETS_KEYS)
        and existing_meta.get("setsImageUrl") == sets_image_url
    )
    if existing and same_schema and existing.get("themes") == themes and existing.get("sets") == sets:
        log(f"Unchanged ({len(sets)} sets, {len(themes)} themes) — {output_path}")
        return 0

    meta = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": SOURCE_URL,
        "numThemes": len(themes),
        "themesKeys": list(THEMES_KEYS),
        "numSets": len(sets),
        "setsKeys": list(SETS_KEYS),
    }
    if sets_image_url:
        meta["setsImageUrl"] = sets_image_url
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_name(f".{output_path.name}.tmp")
    tmp_path.write_text(encode_json(meta, themes, sets), encoding="utf-8")
    tmp_path.replace(output_path)
    log(f"Wrote {len(sets)} sets, {len(themes)} themes — {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
