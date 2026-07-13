ALTER TABLE clothing_items
ADD COLUMN IF NOT EXISTS brand TEXT;

CREATE INDEX IF NOT EXISTS idx_clothing_items_user_brand
ON clothing_items(user_id, brand)
WHERE brand IS NOT NULL;
