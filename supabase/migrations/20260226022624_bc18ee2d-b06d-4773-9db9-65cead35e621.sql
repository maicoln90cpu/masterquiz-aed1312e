
-- ITEM 2: Migrate objectives "other*"

-- Step 1: other:Venda → lead_capture_launch
UPDATE profiles
SET user_objectives = array_replace(user_objectives, 'other:Venda', 'lead_capture_launch')
WHERE 'other:Venda' = ANY(user_objectives);

-- Step 2: All remaining other:* and bare 'other' → educational
UPDATE profiles
SET user_objectives = (
  SELECT array_agg(
    CASE 
      WHEN obj LIKE 'other:%' THEN 'educational'
      WHEN obj = 'other' THEN 'educational'
      ELSE obj
    END
  )
  FROM unnest(user_objectives) obj
)
WHERE EXISTS (SELECT 1 FROM unnest(user_objectives) obj WHERE obj LIKE 'other%');

-- Step 3: Deduplicate arrays
UPDATE profiles
SET user_objectives = (
  SELECT array_agg(DISTINCT obj ORDER BY obj)
  FROM unnest(user_objectives) obj
)
WHERE array_length(user_objectives, 1) > 1
AND (SELECT count(*) FROM unnest(user_objectives) obj) != (SELECT count(DISTINCT obj) FROM unnest(user_objectives) obj);
