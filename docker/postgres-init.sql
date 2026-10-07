-- Runs once on first Postgres boot (docker-entrypoint-initdb.d).
-- The app database ("fgac") is created by POSTGRES_DB; add OpenFGA's store separately.
CREATE DATABASE openfga;
