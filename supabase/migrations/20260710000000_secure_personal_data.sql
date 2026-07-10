-- Secure personal data with Supabase Auth identities.
-- Guests are stored locally by the application; only authenticated users may
-- access cloud wardrobe, history, and preference rows.

-- Remove every legacy policy that trusted application-side filtering or merely
-- checked that a temp_user_id existed.
DROP POLICY IF EXISTS "Enable all operations" ON clothing_items;
DROP POLICY IF EXISTS "Allow select for all users" ON clothing_items;
DROP POLICY IF EXISTS "Allow insert for all users" ON clothing_items;
DROP POLICY IF EXISTS "Allow update for owner" ON clothing_items;
DROP POLICY IF EXISTS "Allow delete for owner" ON clothing_items;

CREATE POLICY "Users can select own clothing items"
  ON clothing_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own clothing items"
  ON clothing_items FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can update own clothing items"
  ON clothing_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can delete own clothing items"
  ON clothing_items FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own outfit history" ON outfit_history;
DROP POLICY IF EXISTS "Users can insert their own outfit history" ON outfit_history;
DROP POLICY IF EXISTS "Users can update their own outfit history" ON outfit_history;
DROP POLICY IF EXISTS "Users can delete their own outfit history" ON outfit_history;
DROP POLICY IF EXISTS "Allow select for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow insert for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow update for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow update for owner" ON outfit_history;
DROP POLICY IF EXISTS "Allow delete for owner" ON outfit_history;
DROP POLICY IF EXISTS "Allow authenticated users to update outfit_history" ON outfit_history;
DROP POLICY IF EXISTS "Allow anon users to update outfit_history" ON outfit_history;
DROP POLICY IF EXISTS "Allow authenticated users to delete own outfit_history" ON outfit_history;
DROP POLICY IF EXISTS "Allow anon users to delete own outfit_history" ON outfit_history;

CREATE POLICY "Users can select own outfit history"
  ON outfit_history FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own outfit history"
  ON outfit_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can update own outfit history"
  ON outfit_history FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can delete own outfit history"
  ON outfit_history FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Enable all operations" ON user_preferences;
DROP POLICY IF EXISTS "Allow select for all users" ON user_preferences;
DROP POLICY IF EXISTS "Allow insert for all users" ON user_preferences;
DROP POLICY IF EXISTS "Allow update for owner" ON user_preferences;
DROP POLICY IF EXISTS "Allow delete for owner" ON user_preferences;

CREATE POLICY "Users can select own preferences"
  ON user_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- The legacy outfits table is no longer used and has no ownership column.
-- Removing its allow-all policy makes it inaccessible until it is retired.
DROP POLICY IF EXISTS "Enable all operations" ON outfits;

-- Share rows remain public only through an id-scoped RPC, preventing anonymous
-- clients from listing every shared outfit through the REST table endpoint.
CREATE TABLE IF NOT EXISTS outfit_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_data JSONB NOT NULL,
  weather_data JSONB NOT NULL,
  location TEXT NOT NULL,
  user_id UUID,
  temp_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE outfit_shares ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'outfit_shares'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON outfit_shares', policy_row.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "Users can insert own outfit shares"
  ON outfit_shares FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can update own outfit shares"
  ON outfit_shares FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND temp_user_id IS NULL);
CREATE POLICY "Users can delete own outfit shares"
  ON outfit_shares FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION get_outfit_share(p_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'outfit', outfit_data,
    'weather', weather_data,
    'location', location,
    'createdAt', created_at
  )
  FROM outfit_shares
  WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION get_outfit_share(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_outfit_share(UUID) TO anon, authenticated;

-- Replace the unrestricted delete RPC with an owner-checked implementation.
CREATE OR REPLACE FUNCTION delete_outfit_history_by_id(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM outfit_history
  WHERE id = p_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION delete_outfit_history_by_id(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_outfit_history_by_id(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION delete_outfit_history_by_id(UUID) TO authenticated;

-- One-time compatibility path for users upgrading from the old temp_user_id
-- model. The destination is always the currently authenticated account.
CREATE OR REPLACE FUNCTION claim_legacy_temp_user_data(p_temp_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user UUID := auth.uid();
  clothing_count INTEGER := 0;
  history_count INTEGER := 0;
  preference_count INTEGER := 0;
BEGIN
  IF target_user IS NULL OR p_temp_user_id IS NULL OR length(p_temp_user_id) < 16 THEN
    RAISE EXCEPTION 'Authentication and a valid legacy id are required';
  END IF;

  UPDATE clothing_items
  SET user_id = target_user, temp_user_id = NULL
  WHERE temp_user_id = p_temp_user_id AND user_id IS NULL;
  GET DIAGNOSTICS clothing_count = ROW_COUNT;

  UPDATE outfit_history
  SET user_id = target_user, temp_user_id = NULL
  WHERE temp_user_id = p_temp_user_id AND user_id IS NULL;
  GET DIAGNOSTICS history_count = ROW_COUNT;

  -- Keep an existing account preference row authoritative.
  IF NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id = target_user) THEN
    UPDATE user_preferences
    SET user_id = target_user, temp_user_id = NULL
    WHERE temp_user_id = p_temp_user_id AND user_id IS NULL;
    GET DIAGNOSTICS preference_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'clothing', clothing_count,
    'history', history_count,
    'preferences', preference_count
  );
END;
$$;

REVOKE ALL ON FUNCTION claim_legacy_temp_user_data(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_legacy_temp_user_data(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION claim_legacy_temp_user_data(TEXT) TO authenticated;

-- Retire the older caller-selected destination function.
DROP FUNCTION IF EXISTS migrate_temp_user_data(TEXT, UUID);
