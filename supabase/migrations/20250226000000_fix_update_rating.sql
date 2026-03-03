-- 修复 outfit_history 评分更新问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 查看当前的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'outfit_history' AND cmd = 'UPDATE';

-- 2. 删除现有的 UPDATE 策略（避免冲突）
DROP POLICY IF EXISTS "Allow update for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow update for owner" ON outfit_history;
DROP POLICY IF EXISTS "Users can update their own outfit history" ON outfit_history;

-- 3. 创建新的 UPDATE 策略 - 允许所有认证用户更新
CREATE POLICY "Allow authenticated users to update outfit_history"
  ON outfit_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- 4. 创建新的 UPDATE 策略 - 允许匿名用户更新（通过 temp_user_id）
CREATE POLICY "Allow anon users to update outfit_history"
  ON outfit_history
  FOR UPDATE
  TO anon
  USING (temp_user_id IS NOT NULL);

-- 5. 验证策略是否创建成功
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'outfit_history' AND cmd = 'UPDATE';

-- 如果上述策略仍不工作，可以尝试完全放开（仅开发环境！）
-- DROP POLICY IF EXISTS "Allow authenticated users to update outfit_history" ON outfit_history;
-- DROP POLICY IF EXISTS "Allow anon users to update outfit_history" ON outfit_history;
-- CREATE POLICY "Allow all updates" ON outfit_history FOR UPDATE USING (true);
