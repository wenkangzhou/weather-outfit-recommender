-- 添加临时用户支持（方案 A：匿名用户 + 可选注册）

-- ============================================
-- 1. 修改 clothing_items 表
-- ============================================
ALTER TABLE clothing_items 
ADD COLUMN IF NOT EXISTS temp_user_id TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 为匿名用户场景创建索引
CREATE INDEX IF NOT EXISTS idx_clothing_items_temp_user 
ON clothing_items(temp_user_id) 
WHERE temp_user_id IS NOT NULL;

-- ============================================
-- 2. 修改 outfit_history 表
-- ============================================
ALTER TABLE outfit_history 
ADD COLUMN IF NOT EXISTS temp_user_id TEXT;

-- user_id 已存在，确保允许 NULL
ALTER TABLE outfit_history 
ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outfit_history_temp_user 
ON outfit_history(temp_user_id) 
WHERE temp_user_id IS NOT NULL;

-- ============================================
-- 3. 修改 user_preferences 表
-- ============================================
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS temp_user_id TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_preferences_temp_user 
ON user_preferences(temp_user_id) 
WHERE temp_user_id IS NOT NULL;

-- ============================================
-- 4. 更新 RLS 策略，支持匿名用户
-- ============================================

-- clothing_items: 允许匿名用户操作自己的数据
DROP POLICY IF EXISTS "Allow select for all users" ON clothing_items;
DROP POLICY IF EXISTS "Allow insert for all users" ON clothing_items;
DROP POLICY IF EXISTS "Allow update for all users" ON clothing_items;
DROP POLICY IF EXISTS "Allow delete for all users" ON clothing_items;

-- 允许任何人查询（通过 temp_user_id 或 user_id 过滤在应用层）
CREATE POLICY "Allow select for all users"
  ON clothing_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 插入时允许 temp_user_id 或 user_id
CREATE POLICY "Allow insert for all users"
  ON clothing_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 更新时检查所有权（temp_user_id 匹配 或 user_id 匹配）
CREATE POLICY "Allow update for owner"
  ON clothing_items
  FOR UPDATE
  TO anon, authenticated
  USING (
    temp_user_id IS NOT NULL 
    OR user_id = auth.uid()
  );

-- 删除时检查所有权
CREATE POLICY "Allow delete for owner"
  ON clothing_items
  FOR DELETE
  TO anon, authenticated
  USING (
    temp_user_id IS NOT NULL 
    OR user_id = auth.uid()
  );

-- outfit_history: 同样的策略
DROP POLICY IF EXISTS "Allow select for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow insert for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow update for all users" ON outfit_history;
DROP POLICY IF EXISTS "Allow delete for all users" ON outfit_history;

CREATE POLICY "Allow select for all users"
  ON outfit_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert for all users"
  ON outfit_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for owner"
  ON outfit_history
  FOR UPDATE
  TO anon, authenticated
  USING (
    temp_user_id IS NOT NULL 
    OR user_id = auth.uid()
  );

CREATE POLICY "Allow delete for owner"
  ON outfit_history
  FOR DELETE
  TO anon, authenticated
  USING (
    temp_user_id IS NOT NULL 
    OR user_id = auth.uid()
  );

-- user_preferences: 同样的策略
DROP POLICY IF EXISTS "Allow select for all users" ON user_preferences;
DROP POLICY IF EXISTS "Allow insert for all users" ON user_preferences;
DROP POLICY IF EXISTS "Allow update for all users" ON user_preferences;
DROP POLICY IF EXISTS "Allow delete for all users" ON user_preferences;

CREATE POLICY "Allow select for all users"
  ON user_preferences
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert for all users"
  ON user_preferences
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for owner"
  ON user_preferences
  FOR UPDATE
  TO anon, authenticated
  USING (
    temp_user_id IS NOT NULL 
    OR user_id = auth.uid()
  );

CREATE POLICY "Allow delete for owner"
  ON user_preferences
  FOR DELETE
  TO anon, authenticated
  USING (
    temp_user_id IS NOT NULL 
    OR user_id = auth.uid()
  );

-- ============================================
-- 5. 创建数据迁移函数（注册时使用）
-- ============================================
CREATE OR REPLACE FUNCTION migrate_temp_user_data(
  p_temp_user_id TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 迁移衣物
  UPDATE clothing_items 
  SET user_id = p_user_id, 
      temp_user_id = NULL 
  WHERE temp_user_id = p_temp_user_id;

  -- 迁移历史
  UPDATE outfit_history 
  SET user_id = p_user_id, 
      temp_user_id = NULL 
  WHERE temp_user_id = p_temp_user_id;

  -- 迁移偏好设置
  UPDATE user_preferences 
  SET user_id = p_user_id, 
      temp_user_id = NULL 
  WHERE temp_user_id = p_temp_user_id;
END;
$$;

-- 给匿名用户授予执行权限
GRANT EXECUTE ON FUNCTION migrate_temp_user_data TO anon, authenticated;
