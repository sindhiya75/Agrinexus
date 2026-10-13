-- AgriNexus AI Database Initialization
-- Enables PostGIS spatial extensions and UUID generator

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Confirm extensions are active
DO $$
BEGIN
    RAISE NOTICE 'PostGIS Version: %', postgis_full_version();
END $$;
