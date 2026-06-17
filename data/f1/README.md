# Formula 1 data + ontology

A complete relational SQLite database of Formula 1 history (1950 to present)
plus an OWL ontology describing it.

## Contents

```
data/f1/
├── build_f1db.py        # builds f1.db from the CSVs (typed, PK/FK, indexed)
├── csv/                 # raw f1db CSV release (the download), 47 files
├── f1.db                # built SQLite DB (gitignored; run the script to make it)
└── ontology/
    ├── f1.ttl           # conceptual OWL ontology (classes, properties, axioms)
    ├── f1-mapping.ttl   # full table/column -> OWL direct mapping (generated)
    ├── f1.schema.json   # data dictionary (tables, columns, types, PK/FK)
    ├── f1-er-diagram.md # Mermaid ER diagram (generated)
    └── f1-ontology.md   # human-readable ontology + competency questions
```

## Source

[github.com/f1db/f1db](https://github.com/f1db/f1db), release `v2026.7.0`,
licensed **CC BY 4.0**. The f1db project is the most comprehensive open F1
dataset: seasons, races, circuits, drivers, constructors, engines, chassis,
tyres, entrants, every session result (practice / qualifying / sprint / race),
pit stops, fastest laps, driver-of-the-day votes and championship standings.

## Build

```bash
cd data/f1
python3 build_f1db.py            # build f1.db from ./csv
python3 build_f1db.py --download # re-fetch the latest CSVs first
```

Output: **47 tables, ~245,000 rows**, all foreign keys validated
(`PRAGMA foreign_key_check` returns 0 rows). The 44 MB `f1.db` is gitignored;
the CSVs and build script reproduce it deterministically.

## Query example

```bash
python3 -c "import sqlite3; print(sqlite3.connect('f1.db').execute(
  \"SELECT d.full_name, COUNT(*) FROM race_result rr JOIN driver d \
     ON d.id=rr.driver_id WHERE rr.position_number=1 \
     GROUP BY d.id ORDER BY 2 DESC LIMIT 3\").fetchall())"
# [('Lewis Carl Davidson Hamilton', 106), ('Michael Schumacher', 91), ('Max Emilian Verstappen', 71)]
```

See `ontology/f1-ontology.md` for the data model and more queries.
