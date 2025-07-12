-- Initialize PostGIS extension for golf database
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for geographic data
-- These will be created after Prisma migration