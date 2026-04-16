CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE(
  table_name text,
  total_bytes bigint,
  total_size text,
  row_estimate bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.relname::text as table_name,
    pg_total_relation_size(c.oid) as total_bytes,
    pg_size_pretty(pg_total_relation_size(c.oid))::text as total_size,
    COALESCE(s.n_live_tup, 0)::bigint as row_estimate
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY pg_total_relation_size(c.oid) DESC;
$$;