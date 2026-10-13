# 🗄️ AgriNexus AI — Database Layer

This directory manages the PostgreSQL + PostGIS database configuration and initialization scripts.

## Extensions Enabled

- **`uuid-ossp`**: Unique identifier generation for entities (farms, fields, sensor logs).
- **`postgis`**: Core spatial data types (`GEOMETRY`, `POLYGON`, `POINT`, `SRID 4326`) and spatial analysis functions.
- **`postgis_topology`**: Topological data structures for boundary calculations and land parcel relationships.

## Local / Docker Execution

When launching with Docker Compose, `init/01-init-postgis.sql` is mounted to `/docker-entrypoint-initdb.d/` and automatically executes upon container creation.

To inspect extensions manually using `psql`:

```sql
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'postgis%';
```
