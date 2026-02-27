-- 创建穿搭历史记录表
CREATE TABLE IF NOT EXISTS outfit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  
  -- 穿搭物品（JSON 格式存储完整物品信息）
  items JSONB NOT NULL,
  
  -- 当时的天气数据
  weather_data JSONB NOT NULL,
  
  -- 位置信息
  location_name TEXT NOT NULL,
  
  -- 场景和跑步类型
  scene TEXT NOT NULL DEFAULT 'commute',
  run_type TEXT,
  
  -- 记录时间
  worn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 用户反馈（可选）
  comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  notes TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_id ON outfit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_history_worn_at ON outfit_history(worn_at DESC);

-- 启用 RLS
ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Users can view their own outfit history"
  ON outfit_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own outfit history"
  ON outfit_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own outfit history"
  ON outfit_history
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own outfit history"
  ON outfit_history
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 如果 outfits 表存在且需要迁移数据，可以取消下面的注释
-- 注意：这需要根据现有数据结构调整
/*
-- 从旧表迁移数据（如果存在）
INSERT INTO outfit_history (user_id, items, weather_data, location_name, scene, run_type, worn_at, created_at)
SELECT 
  user_id,
  jsonb_build_object(
    'top', (SELECT row_to_json(ci) FROM clothing_items ci WHERE ci.id = o.top_id),
    'bottom', (SELECT row_to_json(ci) FROM clothing_items ci WHERE ci.id = o.bottom_id),
    'socks', (SELECT row_to_json(ci) FROM clothing_items ci WHERE ci.id = o.socks_id),
    'shoes', (SELECT row_to_json(ci) FROM clothing_items ci WHERE ci.id = o.shoes_id),
    'scene', o.scene,
    'runType', o.run_type,
    'weatherSnapshot', o.weather_snapshot
  ) as items,
  COALESCE(o.weather_snapshot, '{}'::jsonb) as weather_data,
  COALESCE(o.weather_snapshot->>'cityName', '未知位置') as location_name,
  COALESCE(o.scene, 'commute') as scene,
  o.run_type,
  o.created_at as worn_at,
  o.created_at
FROM outfits o
WHERE NOT EXISTS (SELECT 1 FROM outfit_history oh WHERE oh.id = o.id);
*/
