-- Supabase Database Schema for Weather Outfit Recommender
-- Run this in Supabase Dashboard SQL Editor

-- Enable PostgREST
-- This is automatically enabled in Supabase

-- Clothing Items Table
CREATE TABLE IF NOT EXISTS clothing_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'socks', 'shoes')),
    sub_category TEXT NOT NULL,
    warmth_level INTEGER NOT NULL CHECK (warmth_level BETWEEN 1 AND 10),
    water_resistant BOOLEAN DEFAULT FALSE,
    wind_resistant BOOLEAN DEFAULT FALSE,
    color TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (for single user)
CREATE POLICY "Enable all operations" ON clothing_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Outfits Table (History)
CREATE TABLE IF NOT EXISTS outfits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    top_id UUID REFERENCES clothing_items(id),
    bottom_id UUID REFERENCES clothing_items(id),
    socks_id UUID REFERENCES clothing_items(id),
    shoes_id UUID REFERENCES clothing_items(id),
    scene TEXT NOT NULL CHECK (scene IN ('commute', 'running')),
    weather_snapshot JSONB NOT NULL,
    note TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations" ON outfits
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location TEXT DEFAULT '北京',
    commute_distance NUMERIC DEFAULT 5,
    run_distance NUMERIC DEFAULT 5,
    cold_sensitivity INTEGER DEFAULT 3 CHECK (cold_sensitivity BETWEEN 1 AND 5),
    hot_sensitivity INTEGER DEFAULT 3 CHECK (hot_sensitivity BETWEEN 1 AND 5),
    sweat_level TEXT DEFAULT 'medium' CHECK (sweat_level IN ('low', 'medium', 'high')),
    wind_sensitivity BOOLEAN DEFAULT TRUE,
    rain_preference TEXT DEFAULT 'avoid' CHECK (rain_preference IN ('avoid', 'acceptable', 'brave'))
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations" ON user_preferences
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Storage Bucket (run separately in Storage section)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('clothing-images', 'clothing-images', true);
-- Create policy: Allow public read, authenticated write
