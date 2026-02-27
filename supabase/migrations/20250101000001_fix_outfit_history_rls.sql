-- 修复 outfit_history 表的 RLS 策略，允许匿名插入

-- 先删除现有的 INSERT 策略
DROP POLICY IF EXISTS "Users can insert their own outfit history" ON outfit_history;

-- 创建新的 INSERT 策略，允许所有用户（包括匿名）插入
-- user_id 会通过 DEFAULT auth.uid() 自动设置，如果是匿名用户则为 null
CREATE POLICY "Allow insert for all users"
  ON outfit_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 对于 SELECT/UPDATE/DELETE 仍然限制为只能操作自己的数据
-- 或者匿名用户可以操作所有数据（方便演示）
DROP POLICY IF EXISTS "Users can view their own outfit history" ON outfit_history;
CREATE POLICY "Allow select for all users"
  ON outfit_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own outfit history" ON outfit_history;
CREATE POLICY "Allow update for all users"
  ON outfit_history
  FOR UPDATE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own outfit history" ON outfit_history;
CREATE POLICY "Allow delete for all users"
  ON outfit_history
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 修改 user_id 字段允许 null（匿名用户）
ALTER TABLE outfit_history ALTER COLUMN user_id DROP NOT NULL;
