import { createClient } from '@supabase/supabase-js';
import { ClothingItem, Outfit, UserPreferences, ClothingCategory, ClothingSubCategory, OutfitHistoryItem, WeatherData } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseKey;

// Create client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : (null as any);

// Demo mode helpers
const getDemoItems = (): ClothingItem[] => {
  if (typeof window === 'undefined') return [];
  const items = localStorage.getItem('demo_clothing_items');
  return items ? JSON.parse(items) : [];
};

const setDemoItems = (items: ClothingItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('demo_clothing_items', JSON.stringify(items));
};

const getDemoPrefs = (): UserPreferences | null => {
  if (typeof window === 'undefined') return null;
  const prefs = localStorage.getItem('demo_preferences');
  return prefs ? JSON.parse(prefs) : null;
};

const setDemoPrefs = (prefs: UserPreferences) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('demo_preferences', JSON.stringify(prefs));
};

const getDemoOutfitHistory = (): OutfitHistoryItem[] => {
  if (typeof window === 'undefined') return [];
  const history = localStorage.getItem('demo_outfit_history');
  return history ? JSON.parse(history) : [];
};

const setDemoOutfitHistory = (history: OutfitHistoryItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('demo_outfit_history', JSON.stringify(history));
};

// Helper: get first item from array response
const first = <T>(data: T[] | null): T | null => {
  return data && data.length > 0 ? data[0] : null;
};

// Database row types (use any for flexibility)
interface ClothingItemRow {
  id: string;
  name: string;
  category: any;
  sub_category: any;
  warmth_level: number;
  water_resistant: boolean;
  wind_resistant: boolean;
  usage: 'commute' | 'running' | 'both';
  has_pockets: boolean;
  color: string;
  image_url: string;
  created_at: string;
}

interface UserPreferencesRow {
  id: string;
  location: string;
  default_run_type: 'easy' | 'long' | 'interval';
  // Legacy fields (to be removed)
  commute_distance?: number;
  run_distance?: number;
  cold_sensitivity?: number;
  hot_sensitivity?: number;
  sweat_level?: 'low' | 'medium' | 'high';
  wind_sensitivity?: boolean;
  rain_preference?: 'avoid' | 'acceptable' | 'brave';
}

interface OutfitHistoryRow {
  id: string;
  user_id: string;
  items: any;
  weather_data: any;
  location_name: string;
  worn_at: string;
  created_at: string;
  comfort_rating?: number;
  notes?: string;
  scene?: 'commute' | 'running';
  run_type?: 'easy' | 'long' | 'interval';
}

// API functions
export async function getClothingItems(): Promise<ClothingItem[]> {
  if (!isConfigured || !supabase) return getDemoItems();
  
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('getClothingItems error:', error);
    return getDemoItems();
  }
  
  const rows = (data || []) as ClothingItemRow[];
  
  return rows.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category as ClothingCategory,
    subCategory: item.sub_category as ClothingSubCategory,
    warmthLevel: item.warmth_level,
    waterResistant: item.water_resistant,
    windResistant: item.wind_resistant,
    usage: item.usage || 'both',
    hasPockets: item.has_pockets || false,
    color: item.color,
    imageUrl: item.image_url,
    createdAt: item.created_at,
  }));
}

export async function addClothingItem(item: Omit<ClothingItem, 'id' | 'createdAt'>): Promise<ClothingItem> {
  if (!isConfigured || !supabase) {
    const newItem: ClothingItem = {
      ...item,
      id: 'demo_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setDemoItems([newItem, ...getDemoItems()]);
    return newItem;
  }
  
  const { data, error } = await supabase
    .from('clothing_items')
    .insert([{
      name: item.name,
      category: item.category,
      sub_category: item.subCategory,
      warmth_level: item.warmthLevel,
      water_resistant: item.waterResistant,
      wind_resistant: item.windResistant,
      usage: item.usage,
      has_pockets: item.hasPockets || false,
      color: item.color,
      image_url: item.imageUrl,
      created_at: new Date().toISOString(),
    }])
    .select()
    .limit(1);
  
  if (error) {
    console.error('addClothingItem error:', error);
    throw error;
  }
  
  const record = first(data as ClothingItemRow[]);
  if (!record) throw new Error('No data returned');
  
  return {
    id: record.id,
    name: record.name,
    category: record.category as ClothingCategory,
    subCategory: record.sub_category as ClothingSubCategory,
    warmthLevel: record.warmth_level,
    waterResistant: record.water_resistant,
    windResistant: record.wind_resistant,
    usage: record.usage || 'both',
    hasPockets: record.has_pockets || false,
    color: record.color,
    imageUrl: record.image_url,
    createdAt: record.created_at,
  };
}

export async function updateClothingItem(
  id: string, 
  updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
): Promise<ClothingItem> {
  if (!isConfigured || !supabase) {
    const items = getDemoItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    
    const updatedItem = { ...items[index], ...updates };
    items[index] = updatedItem;
    setDemoItems(items);
    return updatedItem;
  }
  
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.subCategory !== undefined) dbUpdates.sub_category = updates.subCategory;
  if (updates.warmthLevel !== undefined) dbUpdates.warmth_level = updates.warmthLevel;
  if (updates.waterResistant !== undefined) dbUpdates.water_resistant = updates.waterResistant;
  if (updates.windResistant !== undefined) dbUpdates.wind_resistant = updates.windResistant;
  if (updates.usage !== undefined) dbUpdates.usage = updates.usage;
  if (updates.hasPockets !== undefined) dbUpdates.has_pockets = updates.hasPockets;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  
  const { data, error } = await supabase
    .from('clothing_items')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .limit(1);
  
  if (error) throw error;
  
  const record = first(data as ClothingItemRow[]);
  if (!record) throw new Error('Update failed');
  
  return {
    id: record.id,
    name: record.name,
    category: record.category as ClothingCategory,
    subCategory: record.sub_category as ClothingSubCategory,
    warmthLevel: record.warmth_level,
    waterResistant: record.water_resistant,
    windResistant: record.wind_resistant,
    usage: record.usage || 'both',
    hasPockets: record.has_pockets || false,
    color: record.color,
    imageUrl: record.image_url,
    createdAt: record.created_at,
  };
}

export async function deleteClothingItem(id: string): Promise<void> {
  if (!isConfigured || !supabase) {
    setDemoItems(getDemoItems().filter(item => item.id !== id));
    return;
  }
  
  const { error } = await supabase
    .from('clothing_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Outfit History API
export interface SaveOutfitParams {
  items: {
    top: ClothingItem;
    bottom: ClothingItem;
    socks: ClothingItem;
    shoes: ClothingItem;
    hat?: ClothingItem;
    scene: 'commute' | 'running';
    runType?: 'easy' | 'long' | 'interval';
    weatherSnapshot?: WeatherData;
  };
  weatherData: WeatherData;
  locationName: string;
  scene: 'commute' | 'running';
  runType?: 'easy' | 'long' | 'interval';
}

export async function saveOutfitToHistory(params: SaveOutfitParams): Promise<OutfitHistoryItem> {
  const historyItem: OutfitHistoryItem = {
    id: 'demo_' + Date.now(),
    items: params.items,
    weatherData: params.weatherData,
    locationName: params.locationName,
    scene: params.scene,
    runType: params.runType,
    wornAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (!isConfigured || !supabase) {
    const history = getDemoOutfitHistory();
    setDemoOutfitHistory([historyItem, ...history]);
    return historyItem;
  }
  
  const { data, error } = await supabase
    .from('outfit_history')
    .insert([{
      items: params.items,
      weather_data: params.weatherData,
      location_name: params.locationName,
      scene: params.scene,
      run_type: params.runType,
      worn_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }])
    .select()
    .limit(1);
  
  if (error) {
    console.error('saveOutfitToHistory error:', error);
    throw error;
  }
  
  const record = first(data as OutfitHistoryRow[]);
  if (!record) throw new Error('No data returned');
  
  return {
    id: record.id,
    items: record.items,
    weatherData: record.weather_data,
    locationName: record.location_name,
    scene: record.scene || 'commute',
    runType: record.run_type || undefined,
    wornAt: record.worn_at,
    createdAt: record.created_at,
    comfortRating: record.comfort_rating,
    notes: record.notes,
  };
}

export async function getOutfitHistory(): Promise<OutfitHistoryItem[]> {
  if (!isConfigured || !supabase) {
    return getDemoOutfitHistory().sort((a, b) => 
      new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime()
    );
  }
  
  const { data, error } = await supabase
    .from('outfit_history')
    .select('*')
    .order('worn_at', { ascending: false });
  
  if (error) {
    console.error('getOutfitHistory error:', error);
    return [];
  }
  
  const rows = (data || []) as OutfitHistoryRow[];
  return rows.map((record) => ({
    id: record.id,
    items: record.items,
    weatherData: record.weather_data,
    locationName: record.location_name,
    scene: record.scene || 'commute',
    runType: record.run_type || undefined,
    wornAt: record.worn_at,
    createdAt: record.created_at,
    comfortRating: record.comfort_rating,
    notes: record.notes,
  }));
}

export async function deleteOutfitHistory(id: string): Promise<void> {
  if (!isConfigured || !supabase) {
    const history = getDemoOutfitHistory().filter(item => item.id !== id);
    setDemoOutfitHistory(history);
    return;
  }
  
  const { error } = await supabase
    .from('outfit_history')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function updateOutfitHistoryRating(
  id: string, 
  rating: number, 
  notes?: string
): Promise<void> {
  if (!isConfigured || !supabase) {
    const history = getDemoOutfitHistory();
    const index = history.findIndex(item => item.id === id);
    if (index !== -1) {
      history[index].comfortRating = rating;
      if (notes !== undefined) history[index].notes = notes;
      setDemoOutfitHistory(history);
    }
    return;
  }
  
  const updates: any = { comfort_rating: rating };
  if (notes !== undefined) updates.notes = notes;
  
  const { error } = await supabase
    .from('outfit_history')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
}

// Legacy outfit functions (keep for compatibility)
export async function getOutfits(): Promise<Outfit[]> {
  if (!isConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('getOutfits error:', error);
    return [];
  }
  return (data || []) as Outfit[];
}

export async function saveOutfit(outfit: Omit<Outfit, 'id'>): Promise<Outfit> {
  if (!isConfigured || !supabase) {
    return { ...outfit, id: 'demo_' + Date.now() } as Outfit;
  }
  
  const { data, error } = await supabase
    .from('outfits')
    .insert([{
      top_id: outfit.top.id,
      bottom_id: outfit.bottom.id,
      socks_id: outfit.socks.id,
      shoes_id: outfit.shoes.id,
      hat_id: outfit.hat?.id,
      scene: outfit.scene,
      run_type: outfit.runType,
      weather_snapshot: outfit.weatherSnapshot,
      note: outfit.note,
      rating: outfit.rating,
    }])
    .select()
    .limit(1);
  
  if (error) throw error;
  return first(data as Outfit[]) as Outfit;
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  if (!isConfigured || !supabase) return getDemoPrefs();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('getUserPreferences error:', error);
    return getDemoPrefs();
  }
  
  const record = first(data as UserPreferencesRow[]);
  if (!record) return null;
  
  return {
    id: record.id,
    location: record.location,
    defaultRunType: record.default_run_type || 'easy',
  };
}

export async function saveUserPreferences(prefs: Omit<UserPreferences, 'id'>): Promise<UserPreferences> {
  if (!isConfigured || !supabase) {
    const newPrefs = { ...prefs, id: 'demo_prefs' } as UserPreferences;
    setDemoPrefs(newPrefs);
    return newPrefs;
  }
  
  const { data: existingData } = await supabase
    .from('user_preferences')
    .select('id')
    .limit(1);
  
  const existing = first(existingData as { id: string }[]);
  
  const dbPrefs = {
    location: prefs.location,
    default_run_type: prefs.defaultRunType,
  };
  
  if (existing) {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(dbPrefs)
      .eq('id', existing.id)
      .select()
      .limit(1);
    
    if (error) throw error;
    const record = first(data as UserPreferencesRow[]);
    if (!record) throw new Error('Update failed');
    return { ...record, ...prefs };
  } else {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert([dbPrefs])
      .select()
      .limit(1);
    
    if (error) throw error;
    const record = first(data as UserPreferencesRow[]);
    if (!record) throw new Error('Insert failed');
    return { ...record, ...prefs };
  }
}

export async function uploadClothingImage(file: File): Promise<string> {
  if (!isConfigured || !supabase) {
    return URL.createObjectURL(file);
  }
  
  const fileName = `${Date.now()}_${file.name}`;
  const { error } = await supabase
    .storage
    .from('clothing-images')
    .upload(fileName, file);
  
  if (error) {
    console.error('upload error:', error);
    return URL.createObjectURL(file);
  }
  
  const { data } = supabase.storage.from('clothing-images').getPublicUrl(fileName);
  return data.publicUrl;
}
