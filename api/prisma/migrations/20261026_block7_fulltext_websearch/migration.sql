-- unaccent is STABLE, so keep normalization in the existing trigger
-- rather than using it directly in a stored generated column expression.
-- Run after 20261026_block7_search with the same schema search_path.
CREATE OR REPLACE FUNCTION block7_dish_search() RETURNS trigger
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
  NEW."nameSearch" := block7_normalize(NEW.name);
  NEW."searchVector" :=
    setweight(to_tsvector('simple', block7_normalize(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('simple', block7_normalize(coalesce(NEW.description, ''))), 'B');
  RETURN NEW;
END $$;

-- Rebuild existing vectors; future name/description edits use the trigger.
UPDATE dishes SET name = name;
