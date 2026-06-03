CREATE OR REPLACE FUNCTION get_adjacent_profiles(target_slug TEXT)
RETURNS TABLE (
  previous_slug TEXT,
  previous_name TEXT,
  current_slug TEXT,
  current_name TEXT,
  next_slug TEXT,
  next_name TEXT
)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      (SELECT slug FROM profiles WHERE slug < target_slug ORDER BY slug DESC LIMIT 1),
      (SELECT slug FROM profiles ORDER BY slug DESC LIMIT 1)
    ) AS previous_slug,
    COALESCE(
      (SELECT name FROM profiles WHERE slug < target_slug ORDER BY slug DESC LIMIT 1),
      (SELECT name FROM profiles ORDER BY slug DESC LIMIT 1)
    ) AS previous_name,
    slug AS current_slug,
    name AS current_name,
    COALESCE(
      (SELECT slug FROM profiles WHERE slug > target_slug ORDER BY slug ASC LIMIT 1),
      (SELECT slug FROM profiles ORDER BY slug ASC LIMIT 1)
    ) AS next_slug,
    COALESCE(
      (SELECT name FROM profiles WHERE slug > target_slug ORDER BY slug ASC LIMIT 1),
      (SELECT name FROM profiles ORDER BY slug ASC LIMIT 1)
    ) AS next_name
  FROM profiles
  WHERE slug = target_slug
  LIMIT 1;
$$;
