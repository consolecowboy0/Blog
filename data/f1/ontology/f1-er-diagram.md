# F1 Database — Entity-Relationship Diagram

Auto-generated from `f1.schema.json`. 47 tables, 245,236 rows.

```mermaid
erDiagram
  continent {
    string id PK
  }
  country {
    string id PK
    string continent_id FK
  }
  circuit {
    string id PK
    string country_id FK
  }
  circuit_layout {
    string id PK
    string circuit_id FK
  }
  grand_prix {
    string id PK
    string country_id FK
  }
  constructor {
    string id PK
    string country_id FK
  }
  constructor_chronology {
    string parent_constructor_id PK
    int position_display_order PK
    string constructor_id FK
  }
  chassis {
    string id PK
    string constructor_id FK
  }
  engine_manufacturer {
    string id PK
    string country_id FK
  }
  engine {
    string id PK
    string engine_manufacturer_id FK
  }
  tyre_manufacturer {
    string id PK
    string country_id FK
  }
  entrant {
    string id PK
  }
  driver {
    string id PK
    string country_of_birth_country_id FK
    string nationality_country_id FK
    string second_nationality_country_id FK
  }
  driver_family_relationship {
    string parent_driver_id PK
    int position_display_order PK
    string driver_id FK
  }
  season {
    int year PK
  }
  race {
    int id PK
    int year FK
    string grand_prix_id FK
    string circuit_id FK
    string circuit_layout_id FK
  }
  season_driver {
    int year PK
    string driver_id PK
  }
  season_constructor {
    int year PK
    string constructor_id PK
  }
  season_engine_manufacturer {
    int year PK
    string engine_manufacturer_id PK
  }
  season_tyre_manufacturer {
    int year PK
    string tyre_manufacturer_id PK
  }
  season_driver_standing {
    int year PK
    int position_display_order PK
    string driver_id FK
  }
  season_constructor_standing {
    int year PK
    int position_display_order PK
    string constructor_id FK
    string engine_manufacturer_id FK
  }
  season_entrant {
    int year PK
    string entrant_id PK
    string country_id FK
  }
  season_entrant_constructor {
    int year PK
    string entrant_id PK
    string constructor_id PK
    string engine_manufacturer_id PK
  }
  season_entrant_driver {
    int year PK
    string entrant_id PK
    string constructor_id PK
    string engine_manufacturer_id PK
    string driver_id PK
  }
  season_entrant_engine {
    int year PK
    string entrant_id PK
    string constructor_id PK
    string engine_manufacturer_id PK
    string engine_id PK
  }
  season_entrant_chassis {
    int year PK
    string entrant_id PK
    string constructor_id PK
    string engine_manufacturer_id PK
    string chassis_id PK
  }
  season_entrant_tyre_manufacturer {
    int year PK
    string entrant_id PK
    string constructor_id PK
    string engine_manufacturer_id PK
    string tyre_manufacturer_id PK
  }
  race_driver_standing {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
  }
  race_constructor_standing {
    int race_id PK
    int year FK
    int position_display_order PK
    string constructor_id FK
    string engine_manufacturer_id FK
  }
  free_practice_1_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  free_practice_2_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  free_practice_3_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  free_practice_4_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  warming_up_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  pre_qualifying_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  qualifying_1_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  qualifying_2_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  qualifying_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  sprint_qualifying_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  starting_grid_position {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  sprint_starting_grid_position {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  race_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  sprint_race_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  fastest_lap {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  pit_stop {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  driver_of_the_day_result {
    int race_id PK
    int year FK
    int position_display_order PK
    string driver_id FK
    string constructor_id FK
    string engine_manufacturer_id FK
    string tyre_manufacturer_id FK
  }
  continent ||--o{ country : "continent_id"
  country ||--o{ circuit : "country_id"
  circuit ||--o{ circuit_layout : "circuit_id"
  country ||--o{ grand_prix : "country_id"
  country ||--o{ constructor : "country_id"
  constructor ||--o{ constructor_chronology : "parent_constructor_id"
  constructor ||--o{ constructor_chronology : "constructor_id"
  constructor ||--o{ chassis : "constructor_id"
  country ||--o{ engine_manufacturer : "country_id"
  engine_manufacturer ||--o{ engine : "engine_manufacturer_id"
  country ||--o{ tyre_manufacturer : "country_id"
  country ||--o{ driver : "country_of_birth_country_id"
  country ||--o{ driver : "nationality_country_id"
  country ||--o{ driver : "second_nationality_country_id"
  driver ||--o{ driver_family_relationship : "parent_driver_id"
  driver ||--o{ driver_family_relationship : "driver_id"
  season ||--o{ race : "year"
  grand_prix ||--o{ race : "grand_prix_id"
  circuit ||--o{ race : "circuit_id"
  circuit_layout ||--o{ race : "circuit_layout_id"
  season ||--o{ season_driver : "year"
  driver ||--o{ season_driver : "driver_id"
  season ||--o{ season_constructor : "year"
  constructor ||--o{ season_constructor : "constructor_id"
  season ||--o{ season_engine_manufacturer : "year"
  engine_manufacturer ||--o{ season_engine_manufacturer : "engine_manufacturer_id"
  season ||--o{ season_tyre_manufacturer : "year"
  tyre_manufacturer ||--o{ season_tyre_manufacturer : "tyre_manufacturer_id"
  season ||--o{ season_driver_standing : "year"
  driver ||--o{ season_driver_standing : "driver_id"
  season ||--o{ season_constructor_standing : "year"
  constructor ||--o{ season_constructor_standing : "constructor_id"
  engine_manufacturer ||--o{ season_constructor_standing : "engine_manufacturer_id"
  season ||--o{ season_entrant : "year"
  entrant ||--o{ season_entrant : "entrant_id"
  country ||--o{ season_entrant : "country_id"
  season ||--o{ season_entrant_constructor : "year"
  entrant ||--o{ season_entrant_constructor : "entrant_id"
  constructor ||--o{ season_entrant_constructor : "constructor_id"
  engine_manufacturer ||--o{ season_entrant_constructor : "engine_manufacturer_id"
  season ||--o{ season_entrant_driver : "year"
  entrant ||--o{ season_entrant_driver : "entrant_id"
  constructor ||--o{ season_entrant_driver : "constructor_id"
  engine_manufacturer ||--o{ season_entrant_driver : "engine_manufacturer_id"
  driver ||--o{ season_entrant_driver : "driver_id"
  season ||--o{ season_entrant_engine : "year"
  entrant ||--o{ season_entrant_engine : "entrant_id"
  constructor ||--o{ season_entrant_engine : "constructor_id"
  engine_manufacturer ||--o{ season_entrant_engine : "engine_manufacturer_id"
  engine ||--o{ season_entrant_engine : "engine_id"
  season ||--o{ season_entrant_chassis : "year"
  entrant ||--o{ season_entrant_chassis : "entrant_id"
  constructor ||--o{ season_entrant_chassis : "constructor_id"
  engine_manufacturer ||--o{ season_entrant_chassis : "engine_manufacturer_id"
  chassis ||--o{ season_entrant_chassis : "chassis_id"
  season ||--o{ season_entrant_tyre_manufacturer : "year"
  entrant ||--o{ season_entrant_tyre_manufacturer : "entrant_id"
  constructor ||--o{ season_entrant_tyre_manufacturer : "constructor_id"
  engine_manufacturer ||--o{ season_entrant_tyre_manufacturer : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ season_entrant_tyre_manufacturer : "tyre_manufacturer_id"
  race ||--o{ race_driver_standing : "race_id"
  season ||--o{ race_driver_standing : "year"
  driver ||--o{ race_driver_standing : "driver_id"
  race ||--o{ race_constructor_standing : "race_id"
  season ||--o{ race_constructor_standing : "year"
  constructor ||--o{ race_constructor_standing : "constructor_id"
  engine_manufacturer ||--o{ race_constructor_standing : "engine_manufacturer_id"
  race ||--o{ free_practice_1_result : "race_id"
  season ||--o{ free_practice_1_result : "year"
  driver ||--o{ free_practice_1_result : "driver_id"
  constructor ||--o{ free_practice_1_result : "constructor_id"
  engine_manufacturer ||--o{ free_practice_1_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ free_practice_1_result : "tyre_manufacturer_id"
  race ||--o{ free_practice_2_result : "race_id"
  season ||--o{ free_practice_2_result : "year"
  driver ||--o{ free_practice_2_result : "driver_id"
  constructor ||--o{ free_practice_2_result : "constructor_id"
  engine_manufacturer ||--o{ free_practice_2_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ free_practice_2_result : "tyre_manufacturer_id"
  race ||--o{ free_practice_3_result : "race_id"
  season ||--o{ free_practice_3_result : "year"
  driver ||--o{ free_practice_3_result : "driver_id"
  constructor ||--o{ free_practice_3_result : "constructor_id"
  engine_manufacturer ||--o{ free_practice_3_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ free_practice_3_result : "tyre_manufacturer_id"
  race ||--o{ free_practice_4_result : "race_id"
  season ||--o{ free_practice_4_result : "year"
  driver ||--o{ free_practice_4_result : "driver_id"
  constructor ||--o{ free_practice_4_result : "constructor_id"
  engine_manufacturer ||--o{ free_practice_4_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ free_practice_4_result : "tyre_manufacturer_id"
  race ||--o{ warming_up_result : "race_id"
  season ||--o{ warming_up_result : "year"
  driver ||--o{ warming_up_result : "driver_id"
  constructor ||--o{ warming_up_result : "constructor_id"
  engine_manufacturer ||--o{ warming_up_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ warming_up_result : "tyre_manufacturer_id"
  race ||--o{ pre_qualifying_result : "race_id"
  season ||--o{ pre_qualifying_result : "year"
  driver ||--o{ pre_qualifying_result : "driver_id"
  constructor ||--o{ pre_qualifying_result : "constructor_id"
  engine_manufacturer ||--o{ pre_qualifying_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ pre_qualifying_result : "tyre_manufacturer_id"
  race ||--o{ qualifying_1_result : "race_id"
  season ||--o{ qualifying_1_result : "year"
  driver ||--o{ qualifying_1_result : "driver_id"
  constructor ||--o{ qualifying_1_result : "constructor_id"
  engine_manufacturer ||--o{ qualifying_1_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ qualifying_1_result : "tyre_manufacturer_id"
  race ||--o{ qualifying_2_result : "race_id"
  season ||--o{ qualifying_2_result : "year"
  driver ||--o{ qualifying_2_result : "driver_id"
  constructor ||--o{ qualifying_2_result : "constructor_id"
  engine_manufacturer ||--o{ qualifying_2_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ qualifying_2_result : "tyre_manufacturer_id"
  race ||--o{ qualifying_result : "race_id"
  season ||--o{ qualifying_result : "year"
  driver ||--o{ qualifying_result : "driver_id"
  constructor ||--o{ qualifying_result : "constructor_id"
  engine_manufacturer ||--o{ qualifying_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ qualifying_result : "tyre_manufacturer_id"
  race ||--o{ sprint_qualifying_result : "race_id"
  season ||--o{ sprint_qualifying_result : "year"
  driver ||--o{ sprint_qualifying_result : "driver_id"
  constructor ||--o{ sprint_qualifying_result : "constructor_id"
  engine_manufacturer ||--o{ sprint_qualifying_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ sprint_qualifying_result : "tyre_manufacturer_id"
  race ||--o{ starting_grid_position : "race_id"
  season ||--o{ starting_grid_position : "year"
  driver ||--o{ starting_grid_position : "driver_id"
  constructor ||--o{ starting_grid_position : "constructor_id"
  engine_manufacturer ||--o{ starting_grid_position : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ starting_grid_position : "tyre_manufacturer_id"
  race ||--o{ sprint_starting_grid_position : "race_id"
  season ||--o{ sprint_starting_grid_position : "year"
  driver ||--o{ sprint_starting_grid_position : "driver_id"
  constructor ||--o{ sprint_starting_grid_position : "constructor_id"
  engine_manufacturer ||--o{ sprint_starting_grid_position : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ sprint_starting_grid_position : "tyre_manufacturer_id"
  race ||--o{ race_result : "race_id"
  season ||--o{ race_result : "year"
  driver ||--o{ race_result : "driver_id"
  constructor ||--o{ race_result : "constructor_id"
  engine_manufacturer ||--o{ race_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ race_result : "tyre_manufacturer_id"
  race ||--o{ sprint_race_result : "race_id"
  season ||--o{ sprint_race_result : "year"
  driver ||--o{ sprint_race_result : "driver_id"
  constructor ||--o{ sprint_race_result : "constructor_id"
  engine_manufacturer ||--o{ sprint_race_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ sprint_race_result : "tyre_manufacturer_id"
  race ||--o{ fastest_lap : "race_id"
  season ||--o{ fastest_lap : "year"
  driver ||--o{ fastest_lap : "driver_id"
  constructor ||--o{ fastest_lap : "constructor_id"
  engine_manufacturer ||--o{ fastest_lap : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ fastest_lap : "tyre_manufacturer_id"
  race ||--o{ pit_stop : "race_id"
  season ||--o{ pit_stop : "year"
  driver ||--o{ pit_stop : "driver_id"
  constructor ||--o{ pit_stop : "constructor_id"
  engine_manufacturer ||--o{ pit_stop : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ pit_stop : "tyre_manufacturer_id"
  race ||--o{ driver_of_the_day_result : "race_id"
  season ||--o{ driver_of_the_day_result : "year"
  driver ||--o{ driver_of_the_day_result : "driver_id"
  constructor ||--o{ driver_of_the_day_result : "constructor_id"
  engine_manufacturer ||--o{ driver_of_the_day_result : "engine_manufacturer_id"
  tyre_manufacturer ||--o{ driver_of_the_day_result : "tyre_manufacturer_id"
```
