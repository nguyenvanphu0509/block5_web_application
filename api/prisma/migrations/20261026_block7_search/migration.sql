-- Run inside a transaction with search_path = target schema, public, extensions.
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE OR REPLACE FUNCTION block7_normalize(value text) RETURNS text
LANGUAGE sql STABLE STRICT SET search_path FROM CURRENT
AS $$ SELECT lower(replace(unaccent(normalize(value, NFC)), 'đ', 'd')) $$;
CREATE OR REPLACE FUNCTION block7_similarity(a text, b text) RETURNS real
LANGUAGE sql STABLE STRICT SET search_path FROM CURRENT
AS $$ SELECT similarity(a, b) $$;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS "nameSearch" text NOT NULL DEFAULT '';
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
CREATE OR REPLACE FUNCTION block7_dish_search() RETURNS trigger
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
  NEW."nameSearch" := block7_normalize(NEW.name);
  NEW."searchVector" := to_tsvector('simple', block7_normalize(coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, '')));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS block7_dish_search_trigger ON dishes;
CREATE TRIGGER block7_dish_search_trigger BEFORE INSERT OR UPDATE OF name, description ON dishes
FOR EACH ROW EXECUTE FUNCTION block7_dish_search();
UPDATE dishes SET name = name;
CREATE INDEX IF NOT EXISTS dishes_search_vector_gin ON dishes USING gin ("searchVector");
CREATE INDEX IF NOT EXISTS dishes_name_search_trgm ON dishes USING gin ("nameSearch" gin_trgm_ops);
