-- 支持多层上衣的迁移说明
-- 由于 items 字段是 JSONB 类型，不需要修改表结构
-- 但需要确保前端代码兼容新旧数据格式

-- 可选：创建一个视图来统一处理单层/多层上衣
CREATE OR REPLACE VIEW outfit_history_with_layers AS
SELECT 
  id,
  user_id,
  items,
  -- 提取上衣信息（兼容新旧格式）
  CASE 
    WHEN items->>'layeredTops' IS NOT NULL THEN items->'layeredTops'
    WHEN items->>'top' IS NOT NULL THEN jsonb_build_array(items->'top')
    ELSE '[]'::jsonb
  END as top_layers,
  -- 提取其他字段
  items->>'bottom' as bottom_item,
  items->>'socks' as socks_item,
  items->>'shoes' as shoes_item,
  items->>'hat' as hat_item,
  weather_data,
  location_name,
  scene,
  run_type,
  worn_at,
  created_at,
  comfort_rating,
  notes
FROM outfit_history;

-- 说明：前端代码需要兼容以下两种格式
-- 旧格式：{ top: {...}, bottom: {...}, ... }
-- 新格式：{ top: {...}, layeredTops: [{...}, {...}], bottom: {...}, ... }
