# Formula 1 Ontology

A conceptual ontology over `f1.db`, the SQLite database of Formula 1 history
(1950 to present) built by `../build_f1db.py` from the
[f1db](https://github.com/f1db/f1db) open dataset (CC BY 4.0).

Two RDF/OWL files express it, plus a JSON data dictionary and an ER diagram:

| File | What it is |
|------|------------|
| `f1.ttl` | Curated **conceptual** ontology: domain classes, hierarchy, disjointness, object/datatype properties, axioms. |
| `f1-mapping.ttl` | **Direct mapping** auto-generated from the schema: every table is a class, every column a property, every foreign key an object property. Imports `f1.ttl`. |
| `f1.schema.json` | Machine-readable data dictionary (tables, columns, types, PKs, FKs, row counts). |
| `f1-er-diagram.md` | Mermaid entity-relationship diagram of all 47 tables and 169 foreign keys. |

Total: **47 tables, ~245,000 rows**, ~4,000 ontology triples.

---

## 1. Design

The relational schema is normalized but flat. The ontology lifts it into a
classified domain model so you can reason about *kinds* of things, not just
tables.

```
Entity
├── Agent
│   ├── Person
│   │   └── Driver                         (driver)
│   └── Organization
│       ├── Constructor                    (constructor)
│       ├── EngineManufacturer             (engine_manufacturer)
│       ├── TyreManufacturer               (tyre_manufacturer)
│       └── Entrant                        (entrant)
├── TechnicalComponent
│   ├── Chassis                            (chassis)
│   └── Engine                             (engine)
├── Place
│   ├── Continent                          (continent)
│   ├── Country                            (country)
│   ├── Circuit                            (circuit)
│   └── CircuitLayout                      (circuit_layout)
├── GrandPrix                              (grand_prix)
├── Season                                 (season)
├── Race                                   (race)
├── SessionEntry                           (one classified car in one session)
│   ├── PracticeResult                     (free_practice_*, warming_up, pre_qualifying)
│   ├── QualifyingResult                   (qualifying_*, sprint_qualifying)
│   ├── GridPosition                       (starting_grid_position, sprint_*)
│   ├── RaceResult                         (race_result)
│   ├── SprintRaceResult                   (sprint_race_result)
│   ├── FastestLap                         (fastest_lap)
│   ├── PitStop                            (pit_stop)
│   └── DriverOfTheDay                     (driver_of_the_day_result)
└── Standing
    ├── DriverStanding                     (season_/race_driver_standing)
    └── ConstructorStanding                (season_/race_constructor_standing)
```

### Key modelling decisions

- **Constructor vs Entrant vs EngineManufacturer.** F1 separates the *marque*
  that builds the car (Constructor), the *team* that enters it for a season
  (Entrant, e.g. "Scuderia Ferrari"), and the *power-unit maker* (Engine
  Manufacturer). They often coincide but not always (a customer team runs
  another marque's engine). The ontology keeps all three distinct and
  `owl:disjoint`.
- **GrandPrix vs Race.** `GrandPrix` is the recurring franchise ("Monaco Grand
  Prix"); `Race` is one running of it in a given season and round. `Race
  f1:runsGrandPrix GrandPrix` and `Race f1:inSeason Season`.
- **Circuit vs CircuitLayout.** A venue keeps its identity across
  reconfigurations; each layout records the length/turns actually used, and a
  race points at the specific layout.
- **SessionEntry reification.** Every per-session result table is one
  performance record: a driver, in a car (constructor + engine + tyre), in one
  session of one race. Modelling them as subclasses of `SessionEntry` means a
  single property set (`f1:inRace`, `f1:performedBy`, `f1:forConstructor`,
  `f1:usingEngineOf`, `f1:onTyresOf`) applies uniformly across practice,
  qualifying, grid, race, sprint, fastest-lap, pit-stop and DotD rows.

### Core object properties

| Property | Domain → Range | Source column |
|----------|----------------|---------------|
| `f1:inSeason` | Race → Season | `race.year` |
| `f1:runsGrandPrix` | Race → GrandPrix | `race.grand_prix_id` |
| `f1:heldAtCircuit` | Race → Circuit | `race.circuit_id` |
| `f1:usedLayout` | Race → CircuitLayout | `race.circuit_layout_id` |
| `f1:partOfCircuit` | CircuitLayout → Circuit | `circuit_layout.circuit_id` |
| `f1:withinContinent` | Country → Continent | `country.continent_id` |
| `f1:inRace` | SessionEntry → Race | `*.race_id` |
| `f1:performedBy` | SessionEntry → Driver | `*.driver_id` |
| `f1:forConstructor` | SessionEntry → Constructor | `*.constructor_id` |
| `f1:usingEngineOf` | SessionEntry → EngineManufacturer | `*.engine_manufacturer_id` |
| `f1:onTyresOf` | SessionEntry → TyreManufacturer | `*.tyre_manufacturer_id` |
| `f1:builtBy` | Chassis → Constructor | `chassis.constructor_id` |
| `f1:manufacturedBy` | Engine → EngineManufacturer | `engine.engine_manufacturer_id` |
| `f1:hasNationality` | Driver → Country | `driver.nationality_country_id` |
| `f1:relatedToDriver` | Driver ↔ Driver (symmetric) | `driver_family_relationship` |
| `f1:precededBy` | Constructor → Constructor | `constructor_chronology` |

---

## 2. Entity catalogue

**Dimension / entity tables** — `continent`, `country`, `circuit`,
`circuit_layout`, `grand_prix`, `constructor`, `chassis`,
`engine_manufacturer`, `engine`, `tyre_manufacturer`, `entrant`, `driver`,
`season`, `race`.

**Relationship tables** — `driver_family_relationship`,
`constructor_chronology`, and the `season_entrant_*` registrations
(constructor / driver / engine / chassis / tyre per team per year).

**Season aggregates** — `season_driver`, `season_constructor`,
`season_engine_manufacturer`, `season_tyre_manufacturer` (pre-computed career/season totals).

**Standings** — `season_driver_standing`, `season_constructor_standing`,
`race_driver_standing`, `race_constructor_standing` (points + position, with a
`championship_won` flag).

**Session results** — `free_practice_1..4_result`, `warming_up_result`,
`pre_qualifying_result`, `qualifying_1/2_result`, `qualifying_result`,
`sprint_qualifying_result`, `starting_grid_position`,
`sprint_starting_grid_position`, `race_result`, `sprint_race_result`,
`fastest_lap`, `pit_stop`, `driver_of_the_day_result`.

See `f1.schema.json` for every column, type and foreign key.

---

## 3. Competency questions

The ontology supports these questions; each maps to a verified SQL query.

**Who has the most career race wins?**
```sql
SELECT d.full_name, COUNT(*) wins
FROM race_result rr JOIN driver d ON d.id = rr.driver_id
WHERE rr.position_number = 1
GROUP BY d.id ORDER BY wins DESC LIMIT 5;
-- Hamilton 106, Schumacher 91, Verstappen 71, Vettel 53, Prost 51
```

**Who has the most pole positions?**
```sql
SELECT d.full_name, COUNT(*) poles
FROM qualifying_result q JOIN driver d ON d.id = q.driver_id
WHERE q.position_number = 1
GROUP BY d.id ORDER BY poles DESC LIMIT 1;          -- Hamilton, 105
```

**How many Constructors' Championships has Ferrari won?**
```sql
SELECT COUNT(*) FROM season_constructor_standing
WHERE constructor_id = 'ferrari' AND championship_won = 1;   -- 16
```

**Which circuit has hosted the most races?**
```sql
SELECT c.full_name, COUNT(*) n
FROM race r JOIN circuit c ON c.id = r.circuit_id
GROUP BY c.id ORDER BY n DESC LIMIT 1;              -- Monza, 76
```

**Which driver/constructor pairings won races in 2021?**
```sql
SELECT d.last_name, rr.constructor_id, COUNT(*) wins
FROM race_result rr
JOIN driver d ON d.id = rr.driver_id
JOIN race r   ON r.id = rr.race_id
WHERE r.year = 2021 AND rr.position_number = 1
GROUP BY d.id, rr.constructor_id ORDER BY wins DESC;
-- Verstappen/Red Bull 10, Hamilton/Mercedes 8, Ricciardo/McLaren 1
```

**Which drivers are related?**
```sql
SELECT parent_driver_id, driver_id, type
FROM driver_family_relationship;          -- e.g. Ayrton ↔ Bruno Senna
```

**Full provenance of a result** (driver → constructor → engine → tyre →
race → circuit → country) is a single join chain because every `*_id` column
is a declared, indexed foreign key.

---

## 4. Regenerating

```bash
cd data/f1
python3 build_f1db.py --download     # fetch CSVs + build f1.db + write f1.schema.json
```

`build_f1db.py` enforces `PRAGMA foreign_key_check` after load (currently: 0
violations) and writes the data dictionary that drives `f1-mapping.ttl` and the
ER diagram. Validate the ontologies with any RDF tool, e.g.:

```python
from rdflib import Graph
Graph().parse("ontology/f1-mapping.ttl")   # imports f1.ttl
```
