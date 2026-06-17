#!/usr/bin/env python3
"""Build a normalized SQLite database of Formula 1 history from the f1db CSV release.

Source: https://github.com/f1db/f1db (CC BY 4.0). Covers 1950 to present:
seasons, races, circuits, drivers, constructors, engines, chassis, tyres,
entrants, every session result (practice/qualifying/sprint/race), pit stops,
fastest laps, driver-of-the-day and championship standings.

The script reads the raw CSVs in ./csv, infers column types, and writes a
single SQLite file with primary keys, foreign keys and indexes. Each CSV maps
to exactly one table (snake_case), so the schema mirrors the source one-to-one.

Usage:
    python3 build_f1db.py [--csv-dir csv] [--out f1.db] [--download [TAG]]

With --download it fetches and unzips the CSV release from GitHub first
(default tag: latest known release below).
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sqlite3
import sys
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_TAG = "v2026.7.0"
CSV_ZIP_URL = "https://github.com/f1db/f1db/releases/download/{tag}/f1db-csv.zip"

# --- CSV file -> table name -------------------------------------------------
# Names match the f1db canonical model. The canonical DB folds every session
# result into one wide `race_data` table exposed through views; here each
# result CSV becomes its own first-class table instead, which is cleaner to
# query and to describe in the ontology.
FILE_TO_TABLE = {
    "f1db-continents": "continent",
    "f1db-countries": "country",
    "f1db-circuits": "circuit",
    "f1db-circuits-layouts": "circuit_layout",
    "f1db-grands-prix": "grand_prix",
    "f1db-constructors": "constructor",
    "f1db-constructors-chronology": "constructor_chronology",
    "f1db-chassis": "chassis",
    "f1db-engine-manufacturers": "engine_manufacturer",
    "f1db-engines": "engine",
    "f1db-tyre-manufacturers": "tyre_manufacturer",
    "f1db-entrants": "entrant",
    "f1db-drivers": "driver",
    "f1db-drivers-family-relationships": "driver_family_relationship",
    "f1db-seasons": "season",
    "f1db-races": "race",
    # season aggregates / standings
    "f1db-seasons-drivers": "season_driver",
    "f1db-seasons-constructors": "season_constructor",
    "f1db-seasons-engine-manufacturers": "season_engine_manufacturer",
    "f1db-seasons-tyre-manufacturers": "season_tyre_manufacturer",
    "f1db-seasons-driver-standings": "season_driver_standing",
    "f1db-seasons-constructor-standings": "season_constructor_standing",
    "f1db-seasons-entrants": "season_entrant",
    "f1db-seasons-entrants-constructors": "season_entrant_constructor",
    "f1db-seasons-entrants-drivers": "season_entrant_driver",
    "f1db-seasons-entrants-engines": "season_entrant_engine",
    "f1db-seasons-entrants-chassis": "season_entrant_chassis",
    "f1db-seasons-entrants-tyre-manufacturers": "season_entrant_tyre_manufacturer",
    # per-race standings
    "f1db-races-driver-standings": "race_driver_standing",
    "f1db-races-constructor-standings": "race_constructor_standing",
    # per-race session results
    "f1db-races-free-practice-1-results": "free_practice_1_result",
    "f1db-races-free-practice-2-results": "free_practice_2_result",
    "f1db-races-free-practice-3-results": "free_practice_3_result",
    "f1db-races-free-practice-4-results": "free_practice_4_result",
    "f1db-races-warming-up-results": "warming_up_result",
    "f1db-races-pre-qualifying-results": "pre_qualifying_result",
    "f1db-races-qualifying-1-results": "qualifying_1_result",
    "f1db-races-qualifying-2-results": "qualifying_2_result",
    "f1db-races-qualifying-results": "qualifying_result",
    "f1db-races-sprint-qualifying-results": "sprint_qualifying_result",
    "f1db-races-starting-grid-positions": "starting_grid_position",
    "f1db-races-sprint-starting-grid-positions": "sprint_starting_grid_position",
    "f1db-races-race-results": "race_result",
    "f1db-races-sprint-race-results": "sprint_race_result",
    "f1db-races-fastest-laps": "fastest_lap",
    "f1db-races-pit-stops": "pit_stop",
    "f1db-races-driver-of-the-day-results": "driver_of_the_day_result",
}

# Primary keys per table (in snake_case column names).
PRIMARY_KEYS = {
    "continent": ["id"],
    "country": ["id"],
    "circuit": ["id"],
    "circuit_layout": ["id"],
    "grand_prix": ["id"],
    "constructor": ["id"],
    "constructor_chronology": ["parent_constructor_id", "position_display_order"],
    "chassis": ["id"],
    "engine_manufacturer": ["id"],
    "engine": ["id"],
    "tyre_manufacturer": ["id"],
    "entrant": ["id"],
    "driver": ["id"],
    "driver_family_relationship": ["parent_driver_id", "position_display_order"],
    "season": ["year"],
    "race": ["id"],
    "season_driver": ["year", "driver_id"],
    "season_constructor": ["year", "constructor_id"],
    "season_engine_manufacturer": ["year", "engine_manufacturer_id"],
    "season_tyre_manufacturer": ["year", "tyre_manufacturer_id"],
    "season_driver_standing": ["year", "position_display_order"],
    "season_constructor_standing": ["year", "position_display_order"],
    "season_entrant": ["year", "entrant_id"],
    "season_entrant_constructor": ["year", "entrant_id", "constructor_id", "engine_manufacturer_id"],
    "season_entrant_driver": ["year", "entrant_id", "constructor_id", "engine_manufacturer_id", "driver_id"],
    "season_entrant_engine": ["year", "entrant_id", "constructor_id", "engine_manufacturer_id", "engine_id"],
    "season_entrant_chassis": ["year", "entrant_id", "constructor_id", "engine_manufacturer_id", "chassis_id"],
    "season_entrant_tyre_manufacturer": ["year", "entrant_id", "constructor_id", "engine_manufacturer_id", "tyre_manufacturer_id"],
    "race_driver_standing": ["race_id", "position_display_order"],
    "race_constructor_standing": ["race_id", "position_display_order"],
}
# Every per-race session-result table shares the same key.
_RESULT_TABLES = [
    "free_practice_1_result", "free_practice_2_result", "free_practice_3_result",
    "free_practice_4_result", "warming_up_result", "pre_qualifying_result",
    "qualifying_1_result", "qualifying_2_result", "qualifying_result",
    "sprint_qualifying_result", "starting_grid_position",
    "sprint_starting_grid_position", "race_result", "sprint_race_result",
    "fastest_lap", "pit_stop", "driver_of_the_day_result",
]
for _t in _RESULT_TABLES:
    PRIMARY_KEYS[_t] = ["race_id", "position_display_order"]

# Foreign keys: snake_case column -> referenced table. Resolved generically by
# column name; this map handles columns whose name does not equal "<table>_id".
FK_COLUMN_TO_TABLE = {
    "year": "season",
    "race_id": "race",
    "driver_id": "driver",
    "parent_driver_id": "driver",
    "constructor_id": "constructor",
    "parent_constructor_id": "constructor",
    "engine_manufacturer_id": "engine_manufacturer",
    "engine_id": "engine",
    "chassis_id": "chassis",
    "tyre_manufacturer_id": "tyre_manufacturer",
    "circuit_id": "circuit",
    "circuit_layout_id": "circuit_layout",
    "grand_prix_id": "grand_prix",
    "entrant_id": "entrant",
    "continent_id": "continent",
    "country_id": "country",
    "country_of_birth_country_id": "country",
    "nationality_country_id": "country",
    "second_nationality_country_id": "country",
}

BOOL_TRUE = {"true", "True", "TRUE", "1"}
BOOL_FALSE = {"false", "False", "FALSE", "0"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
INT_RE = re.compile(r"^-?\d+$")
REAL_RE = re.compile(r"^-?\d+\.\d+$")


def snake(name: str) -> str:
    """camelCase -> snake_case, splitting only on case boundaries."""
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "_", name).lower()


def table_for(stem: str) -> str:
    if stem not in FILE_TO_TABLE:
        raise KeyError(f"No table mapping for CSV '{stem}'")
    return FILE_TO_TABLE[stem]


def infer_type(values: list[str]) -> str:
    """Pick a SQLite type from sampled non-empty string values."""
    seen = [v for v in values if v != ""]
    if not seen:
        return "TEXT"
    if all(v in BOOL_TRUE or v in BOOL_FALSE for v in seen) and any(
        v in {"true", "false", "True", "False", "TRUE", "FALSE"} for v in seen
    ):
        return "BOOLEAN"
    if all(INT_RE.match(v) for v in seen):
        return "INTEGER"
    if all(INT_RE.match(v) or REAL_RE.match(v) for v in seen):
        return "REAL"
    if all(DATE_RE.match(v) for v in seen):
        return "DATE"
    return "TEXT"


def convert(value: str, sqltype: str):
    if value == "":
        return None
    if sqltype == "BOOLEAN":
        return 1 if value in BOOL_TRUE else 0
    if sqltype == "INTEGER":
        return int(value)
    if sqltype == "REAL":
        return float(value)
    return value


def read_csv(path: Path):
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)
    cols = [snake(h) for h in header]
    return cols, rows


def build_table_spec(path: Path):
    cols, rows = read_csv(path)
    types = []
    for i, _ in enumerate(cols):
        sample = [r[i] for r in rows]
        types.append(infer_type(sample))
    return cols, types, rows


def fk_for(col: str, table: str) -> str | None:
    ref = FK_COLUMN_TO_TABLE.get(col)
    if ref and ref != table:  # no self-FK that would block load ordering
        return ref
    # generic "<thing>_id" -> "<thing>" when such a table exists
    if col.endswith("_id"):
        cand = col[:-3]
        if cand in FILE_TO_TABLE.values() and cand != table:
            return cand
    return None


def create_table_sql(table: str, cols, types) -> str:
    lines = []
    for c, t in zip(cols, types):
        decl = "INTEGER" if t == "BOOLEAN" else t
        lines.append(f'  "{c}" {decl}')
    pk = PRIMARY_KEYS.get(table)
    if pk:
        lines.append('  PRIMARY KEY (' + ", ".join(f'"{c}"' for c in pk) + ")")
    for c in cols:
        ref = fk_for(c, table)
        if ref:
            ref_key = "year" if ref == "season" else "id"
            lines.append(f'  FOREIGN KEY ("{c}") REFERENCES "{ref}" ("{ref_key}")')
    return f'CREATE TABLE "{table}" (\n' + ",\n".join(lines) + "\n)"


def download_csvs(tag: str, dest: Path):
    url = CSV_ZIP_URL.format(tag=tag)
    print(f"downloading {url}")
    with urllib.request.urlopen(url) as resp:  # noqa: S310 (trusted host)
        data = resp.read()
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        z.extractall(dest)
    print(f"extracted {len(list(dest.glob('*.csv')))} CSVs to {dest}")


# Load order: parents before children so a strict FK pass would also pass.
LOAD_ORDER = [
    "continent", "country", "circuit", "circuit_layout", "grand_prix",
    "constructor", "constructor_chronology", "chassis", "engine_manufacturer",
    "engine", "tyre_manufacturer", "entrant", "driver",
    "driver_family_relationship", "season", "race",
    "season_driver", "season_constructor", "season_engine_manufacturer",
    "season_tyre_manufacturer", "season_driver_standing",
    "season_constructor_standing", "season_entrant",
    "season_entrant_constructor", "season_entrant_driver",
    "season_entrant_engine", "season_entrant_chassis",
    "season_entrant_tyre_manufacturer", "race_driver_standing",
    "race_constructor_standing",
] + _RESULT_TABLES


def build(csv_dir: Path, out: Path):
    table_to_file = {v: k for k, v in FILE_TO_TABLE.items()}
    if out.exists():
        out.unlink()
    con = sqlite3.connect(out)
    con.execute("PRAGMA foreign_keys = OFF")  # bulk load; verified afterwards
    cur = con.cursor()

    data_dict = {}
    ordered = LOAD_ORDER + [t for t in FILE_TO_TABLE.values() if t not in LOAD_ORDER]
    for table in ordered:
        stem = table_to_file[table]
        path = csv_dir / f"{stem}.csv"
        if not path.exists():
            print(f"  skip {table}: {path.name} not found")
            continue
        cols, types, rows = build_table_spec(path)
        cur.execute(create_table_sql(table, cols, types))
        typed_rows = [
            tuple(convert(v, t) for v, t in zip(row, types)) for row in rows
        ]
        placeholders = ",".join("?" * len(cols))
        cur.executemany(
            f'INSERT INTO "{table}" VALUES ({placeholders})', typed_rows
        )
        data_dict[table] = {
            "source_csv": path.name,
            "row_count": len(rows),
            "primary_key": PRIMARY_KEYS.get(table, []),
            "columns": [
                {
                    "name": c,
                    "type": t,
                    "references": fk_for(c, table),
                }
                for c, t in zip(cols, types)
            ],
        }
        print(f"  {table:<34} {len(rows):>7} rows  {len(cols)} cols")

    # Indexes on every foreign-key column.
    for table, meta in data_dict.items():
        for col in meta["columns"]:
            if col["references"]:
                idx = f'idx_{table}_{col["name"]}'
                cur.execute(
                    f'CREATE INDEX "{idx}" ON "{table}" ("{col["name"]}")'
                )
    # Helpful query indexes.
    cur.execute('CREATE INDEX "idx_race_year_round" ON "race" ("year", "round")')

    con.commit()

    # Validate referential integrity now that data is loaded.
    con.execute("PRAGMA foreign_keys = ON")
    violations = con.execute("PRAGMA foreign_key_check").fetchall()
    if violations:
        print(f"WARNING: {len(violations)} foreign-key violations", file=sys.stderr)
        for v in violations[:20]:
            print("   ", v, file=sys.stderr)
    else:
        print("foreign-key check: OK")

    con.execute("ANALYZE")
    con.commit()

    dd_path = HERE / "ontology" / "f1.schema.json"
    dd_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "source": "https://github.com/f1db/f1db",
        "license": "CC BY 4.0",
        "release_tag": DEFAULT_TAG,
        "table_count": len(data_dict),
        "row_total": sum(m["row_count"] for m in data_dict.values()),
        "tables": data_dict,
    }
    dd_path.write_text(json.dumps(summary, indent=2))
    print(f"wrote data dictionary -> {dd_path}")
    con.close()
    return summary


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv-dir", default=str(HERE / "csv"))
    ap.add_argument("--out", default=str(HERE / "f1.db"))
    ap.add_argument(
        "--download", nargs="?", const=DEFAULT_TAG, default=None,
        metavar="TAG", help="download CSV release before building",
    )
    args = ap.parse_args()
    csv_dir = Path(args.csv_dir)
    if args.download:
        download_csvs(args.download, csv_dir)
    if not csv_dir.exists():
        sys.exit(f"CSV dir not found: {csv_dir} (use --download)")
    s = build(csv_dir, Path(args.out))
    print(f"\nDone: {s['table_count']} tables, {s['row_total']:,} rows -> {args.out}")


if __name__ == "__main__":
    main()
