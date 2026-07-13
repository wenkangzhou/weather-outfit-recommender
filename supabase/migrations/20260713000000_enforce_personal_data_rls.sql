-- Remove policy drift left by legacy/dashboard-created policies. PostgreSQL
-- combines permissive policies with OR, so one unknown allow-all policy is
-- enough to bypass otherwise-correct owner policies.
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('clothing_items', 'outfit_history', 'user_preferences')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  END LOOP;
END;
$$;

ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

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
