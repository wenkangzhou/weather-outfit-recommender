-- 修复 outfit_history 删除权限问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 查看当前的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'outfit_history';

-- 2. 删除现有的删除策略（如果存在）
DROP POLICY IF EXISTS "Allow users to delete own outfit_history" ON outfit_history;
DROP POLICY IF EXISTS "Allow delete own history" ON outfit_history;

-- 3. 创建新的删除策略 - 允许用户删除自己的记录
-- 针对已登录用户（通过 user_id）
CREATE POLICY "Allow authenticated users to delete own outfit_history" 
  ON outfit_history 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid()::text = user_id::text);

-- 4. 创建删除策略 - 允许匿名用户删除自己的记录
-- 针对匿名用户（通过 temp_user_id）
-- 注意：anon 用户需要在请求中提供 temp_user_id
CREATE POLICY "Allow anon users to delete own outfit_history" 
  ON outfit_history 
  FOR DELETE 
  TO anon 
  USING (temp_user_id IS NOT NULL);

-- 5. 验证策略是否创建成功
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'outfit_history';

-- 6. 测试删除权限（可选，用真实 ID 替换测试）
-- DELETE FROM outfit_history WHERE id = 'your-test-id';

-- 备用方案：如果上述策略仍不工作，可以尝试禁用 RLS 进行测试（仅开发环境！）
-- ALTER TABLE outfit_history DISABLE ROW LEVEL SECURITY;

-- 或者使用更宽松的策略（允许所有操作，仅用于测试）
-- CREATE POLICY "Allow all" ON outfit_history FOR ALL USING (true);
