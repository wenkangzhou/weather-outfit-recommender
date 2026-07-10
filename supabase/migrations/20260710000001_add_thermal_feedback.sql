ALTER TABLE outfit_history
ADD COLUMN IF NOT EXISTS thermal_feedback TEXT
CHECK (thermal_feedback IN ('cold', 'comfortable', 'hot'));
