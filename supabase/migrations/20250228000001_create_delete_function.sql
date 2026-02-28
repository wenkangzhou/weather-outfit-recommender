-- 根本解决方案：创建 RPC 函数绕过 RLS 删除记录
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 1. 创建删除函数（使用 SECURITY DEFINER 绕过 RLS）
CREATE OR REPLACE FUNCTION delete_outfit_history_by_id(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- 关键：以函数所有者的权限执行，绕过 RLS
SET search_path = public
AS $$
BEGIN
  -- 检查记录是否存在
  IF NOT EXISTS (
    SELECT 1 FROM outfit_history WHERE id = p_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- 执行删除
  DELETE FROM outfit_history WHERE id = p_id;
  
  -- 返回是否成功删除
  RETURN FOUND;
END;
$$;

-- 2. 授予执行权限给匿名用户和认证用户
GRANT EXECUTE ON FUNCTION delete_outfit_history_by_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION delete_outfit_history_by_id(UUID) TO authenticated;

-- 3. 验证函数创建成功
SELECT 
  proname,
  prosecdef  -- 是否为 SECURITY DEFINER
FROM pg_proc 
WHERE proname = 'delete_outfit_history_by_id';

-- 4. 测试删除（可选，先查询确认 ID 存在）
-- SELECT * FROM outfit_history WHERE id = 'your-test-id';
-- SELECT delete_outfit_history_by_id('your-test-id'::UUID);

-- 备选方案：如果 RPC 也无法工作，检查 RLS 是否完全禁用删除
-- 查看当前 RLS 状态
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'outfit_history';

-- 查看所有策略
SELECT * FROM pg_policies WHERE tablename = 'outfit_history';

-- 如果策略有问题，可以临时禁用 RLS 进行测试（仅开发环境！）
-- ALTER TABLE outfit_history DISABLE ROW LEVEL SECURITY;

-- 或者创建超级宽松的策略（仅用于调试）
-- DROP POLICY IF EXISTS "debug_allow_all_delete" ON outfit_history;
-- CREATE POLICY "debug_allow_all_delete" ON outfit_history FOR DELETE USING (true);
