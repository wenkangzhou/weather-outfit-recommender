-- 更新 clothing_items 表结构

-- 1. 添加 usage 列（如果还不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clothing_items' AND column_name = 'usage') THEN
        ALTER TABLE clothing_items ADD COLUMN usage TEXT DEFAULT 'both';
    END IF;
END $$;

-- 2. 添加 has_pockets 列（如果还不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clothing_items' AND column_name = 'has_pockets') THEN
        ALTER TABLE clothing_items ADD COLUMN has_pockets BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. 更新现有数据的 usage 字段为 'both'（如果为 null）
UPDATE clothing_items SET usage = 'both' WHERE usage IS NULL;

-- 4. 确保 category 支持 'hat' 值
-- 注：category 列是 text 类型，不需要额外修改

-- 5. 添加约束（可选）
DO $$
BEGIN
    -- 删除旧的检查约束（如果存在）
    ALTER TABLE clothing_items DROP CONSTRAINT IF EXISTS clothing_items_category_check;
    
    -- 添加新的检查约束
    ALTER TABLE clothing_items ADD CONSTRAINT clothing_items_category_check 
        CHECK (category IN ('top', 'bottom', 'socks', 'shoes', 'hat'));
END $$;

-- 6. 刷新 schema 缓存
NOTIFY pgrst, 'reload schema';
