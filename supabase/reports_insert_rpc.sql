-- ============================================
-- Reports: insert via RPC so RLS doesn't block (auth still enforced in function)
-- Run this in Supabase SQL Editor after reports_migration.sql
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_report(
  p_user_id UUID,
  p_message TEXT,
  p_subject TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO reports (user_id, message, subject)
  VALUES (p_user_id, p_message, NULLIF(TRIM(COALESCE(p_subject, '')), ''))
  RETURNING id INTO new_id;

  SELECT to_jsonb(r) INTO result FROM reports r WHERE r.id = new_id;
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.insert_report(UUID, TEXT, TEXT) IS 'Insert a user report; caller must be authenticated and p_user_id = auth.uid()';

GRANT EXECUTE ON FUNCTION public.insert_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_report(UUID, TEXT, TEXT) TO anon;
