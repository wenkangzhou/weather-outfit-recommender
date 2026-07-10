import { createClient } from '@supabase/supabase-js';
import { ClothingItem, Outfit, UserPreferences, ClothingCategory, ClothingSubCategory, OutfitHistoryItem, WeatherData } from '@/types';
import { getCurrentUser } from './user';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseKey;

// Create client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
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

// Helper: get current user context for queries
function getUserContext() {
  const { userId } = getCurrentUser();
  return { userId };
}

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
  user_id?: string;
  temp_user_id?: string;
  is_virtual?: boolean;
}

interface UserPreferencesRow {
  id: string;
  location: string;
  default_run_type: 'easy' | 'long' | 'interval';
  user_id?: string;
  temp_user_id?: string;
  // Temperature preferences
  commute_target_temp?: number;
  easy_run_target_temp?: number;
  long_run_target_temp?: number;
  interval_run_target_temp?: number;
  // Default scene preference
  default_scene?: 'commute' | 'running';
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
  user_id?: string;
  temp_user_id?: string;
  items: any;
  weather_data: any;
  location_name: string;
  worn_at: string;
  created_at: string;
  comfort_rating?: number;
  thermal_feedback?: 'cold' | 'comfortable' | 'hot';
  notes?: string;
  scene?: 'commute' | 'running';
  run_type?: 'easy' | 'long' | 'interval';
}

// API functions
export async function getClothingItems(): Promise<ClothingItem[]> {
  const { userId } = getUserContext();
  if (!isConfigured || !supabase || !userId) return getDemoItems();
  
  let query = supabase
    .from('clothing_items')
    .select('*')
    .order('created_at', { ascending: false });
  
  query = query.eq('user_id', userId);
  
  // 数据库没有 is_virtual 列，查询时排除
  query = query.select('id,name,category,sub_category,warmth_level,water_resistant,wind_resistant,usage,has_pockets,color,image_url,created_at,user_id,temp_user_id');
  
  const { data, error } = await query;
  
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
    // 数据库没有 is_virtual 列，默认 false
    isVirtual: false,
  }));
}

export async function addClothingItem(item: Omit<ClothingItem, 'id' | 'createdAt'>): Promise<ClothingItem> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
    const newItem: ClothingItem = {
      ...item,
      id: 'demo_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setDemoItems([newItem, ...getDemoItems()]);
    return newItem;
  }
  
  const insertData: any = {
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
    // 注意：数据库没有 is_virtual 列，不发送该字段
  };
  
  insertData.user_id = userId;
  insertData.temp_user_id = null;
  
  const { data, error } = await supabase
    .from('clothing_items')
    .insert([insertData])
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
    // 数据库没有 is_virtual 列，默认 false
    isVirtual: false,
  };
}

export async function updateClothingItem(
  id: string, 
  updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
): Promise<ClothingItem> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
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
  // 注意：数据库没有 is_virtual 列，不更新该字段
  
  let query = supabase
    .from('clothing_items')
    .update(dbUpdates)
    .eq('id', id);
  
  query = query.eq('user_id', userId);
  
  const { data, error } = await query.select().limit(1);
  
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
    isVirtual: record.is_virtual || false,
  };
}

export async function deleteClothingItem(id: string): Promise<void> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
    setDemoItems(getDemoItems().filter(item => item.id !== id));
    return;
  }
  
  let query = supabase
    .from('clothing_items')
    .delete()
    .eq('id', id);
  
  query = query.eq('user_id', userId);
  
  const { error } = await query;
  
  if (error) throw error;
}

// Outfit History API
export interface SaveOutfitParams {
  items: {
    top: ClothingItem;
    layeredTops?: ClothingItem[]; // 多层上衣支持
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
  const { userId } = getUserContext();
  
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

  if (!isConfigured || !supabase || !userId) {
    const history = getDemoOutfitHistory();
    setDemoOutfitHistory([historyItem, ...history]);
    return historyItem;
  }
  
  const insertData: any = {
    items: params.items,
    weather_data: params.weatherData,
    location_name: params.locationName,
    scene: params.scene,
    run_type: params.runType,
    worn_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  
  insertData.user_id = userId;
  insertData.temp_user_id = null;
  
  const { data, error } = await supabase
    .from('outfit_history')
    .insert([insertData])
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
    thermalFeedback: record.thermal_feedback,
    notes: record.notes,
  };
}

export async function getOutfitHistory(): Promise<OutfitHistoryItem[]> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
    return getDemoOutfitHistory().sort((a, b) => 
      new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime()
    );
  }
  
  let query = supabase
    .from('outfit_history')
    .select('*')
    .order('worn_at', { ascending: false });
  
  query = query.eq('user_id', userId);
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[getOutfitHistory] Error:', error);
    return [];
  }
  
  console.log('[getOutfitHistory] Loaded:', data?.length || 0);
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
    thermalFeedback: record.thermal_feedback,
    notes: record.notes,
  }));
}

export async function deleteOutfitHistory(id: string): Promise<void> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
    const history = getDemoOutfitHistory().filter(item => item.id !== id);
    setDemoOutfitHistory(history);
    return;
  }

  const { error } = await supabase
    .from('outfit_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateOutfitHistoryRating(
  id: string, 
  rating: number, 
  notes?: string
): Promise<void> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
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
  
  let query = supabase
    .from('outfit_history')
    .update(updates)
    .eq('id', id);
  
  query = query.eq('user_id', userId);
  
  const { error } = await query;
  
  if (error) throw error;
}

export async function updateOutfitHistoryFeedback(
  id: string,
  feedback: 'cold' | 'comfortable' | 'hot',
): Promise<void> {
  const { userId } = getUserContext();

  if (!isConfigured || !supabase || !userId) {
    const history = getDemoOutfitHistory();
    const index = history.findIndex(item => item.id === id);
    if (index !== -1) {
      history[index].thermalFeedback = feedback;
      setDemoOutfitHistory(history);
    }
    return;
  }

  const { error } = await supabase
    .from('outfit_history')
    .update({ thermal_feedback: feedback })
    .eq('id', id)
    .eq('user_id', userId);

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
  const { userId } = getUserContext();
  
  console.log('[getUserPreferences] ===== START =====');
  console.log('[getUserPreferences] Context:', { userId, isConfigured: !!isConfigured });
  
  if (!isConfigured || !supabase || !userId) {
    console.log('[getUserPreferences] Using demo prefs (not configured)');
    return getDemoPrefs();
  }
  
  let query = supabase
    .from('user_preferences')
    .select('*');
  
  query = query.eq('user_id', userId);
  
  const { data, error } = await query.limit(1);
  
  if (error) {
    console.error('[getUserPreferences] Error:', error);
    return getDemoPrefs();
  }
  
  const record = first(data as UserPreferencesRow[]);
  console.log('[getUserPreferences] Raw record from DB:', record);
  
  if (!record) {
    console.log('[getUserPreferences] No record found');
    return null;
  }
  
  const result = {
    id: record.id,
    location: record.location,
    defaultRunType: record.default_run_type || 'easy',
    commuteTargetTemp: record.commute_target_temp,
    easyRunTargetTemp: record.easy_run_target_temp,
    longRunTargetTemp: record.long_run_target_temp,
    intervalRunTargetTemp: record.interval_run_target_temp,
    defaultScene: record.default_scene,
  };
  
  console.log('[getUserPreferences] Mapped result:', result);
  console.log('[getUserPreferences] ===== END =====');
  return result;
}

export async function saveUserPreferences(prefs: Omit<UserPreferences, 'id'>): Promise<UserPreferences> {
  const { userId } = getUserContext();
  
  console.log('[saveUserPreferences] ===== START =====');
  console.log('[saveUserPreferences] Context:', { userId, isConfigured: !!isConfigured, hasSupabase: !!supabase });
  console.log('[saveUserPreferences] Input prefs:', prefs);
  
  // 未配置 Supabase 或没有登录用户：使用 localStorage
  if (!isConfigured || !supabase || !userId) {
    console.log('[saveUserPreferences] Using localStorage. Reason:', { 
      notConfigured: !isConfigured, 
      noSupabase: !supabase, 
      noUserId: !userId 
    });
    const newPrefs = { ...prefs, id: 'demo_prefs' } as UserPreferences;
    setDemoPrefs(newPrefs);
    console.log('[saveUserPreferences] Saved to localStorage:', newPrefs);
    console.log('[saveUserPreferences] ===== END (localStorage) =====');
    return newPrefs;
  }
  
  // 检查是否已存在
  console.log('[saveUserPreferences] Checking existing record for userId:', userId);
  
  const existingQuery = supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', userId);
  
  const { data: existingData, error: existingError } = await existingQuery.limit(1);
  
  if (existingError) {
    console.error('[saveUserPreferences] Error checking existing:', existingError);
    throw existingError;
  }
  
  const existing = first(existingData as { id: string }[]);
  console.log('[saveUserPreferences] Existing record:', existing);
  
  const dbPrefs: any = {
    location: prefs.location,
    default_run_type: prefs.defaultRunType,
    commute_target_temp: prefs.commuteTargetTemp,
    easy_run_target_temp: prefs.easyRunTargetTemp,
    long_run_target_temp: prefs.longRunTargetTemp,
    interval_run_target_temp: prefs.intervalRunTargetTemp,
    default_scene: prefs.defaultScene,
  };
  
  dbPrefs.user_id = userId;
  dbPrefs.temp_user_id = null;
  
  console.log('[saveUserPreferences] DB payload:', dbPrefs);
  
  try {
    if (existing) {
      console.log('[saveUserPreferences] Updating existing record:', existing.id);
      const { data, error } = await supabase
        .from('user_preferences')
        .update(dbPrefs)
        .eq('id', existing.id)
        .select()
        .limit(1);
      
      if (error) {
        console.error('[saveUserPreferences] Update error:', error);
        throw error;
      }
      const record = first(data as UserPreferencesRow[]);
      if (!record) throw new Error('Update failed');
      console.log('[saveUserPreferences] Update success:', record);
      console.log('[saveUserPreferences] ===== END (update) =====');
      return { ...record, ...prefs };
    } else {
      console.log('[saveUserPreferences] Inserting new record');
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([dbPrefs])
        .select()
        .limit(1);
      
      if (error) {
        console.error('[saveUserPreferences] Insert error:', error);
        throw error;
      }
      const record = first(data as UserPreferencesRow[]);
      if (!record) throw new Error('Insert failed');
      console.log('[saveUserPreferences] Insert success:', record);
      console.log('[saveUserPreferences] ===== END (insert) =====');
      return { ...record, ...prefs };
    }
  } catch (e) {
    console.error('[saveUserPreferences] Exception:', e);
    throw e;
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

export interface LocalGuestDataSnapshot {
  items: ClothingItem[];
  history: OutfitHistoryItem[];
  preferences: UserPreferences | null;
}

export interface GuestMergeResult {
  clothing: number;
  history: number;
  preferences: number;
  legacyClaimed: boolean;
}

// Merge locally stored guest data after a successful authenticated login.
// RLS still enforces that every inserted row belongs to the active auth user.
export async function mergeLocalGuestDataIntoAccount(
  snapshot: LocalGuestDataSnapshot,
  userId: string,
  legacyTempUserId?: string | null,
): Promise<GuestMergeResult> {
  const result: GuestMergeResult = {
    clothing: 0,
    history: 0,
    preferences: 0,
    legacyClaimed: false,
  };

  if (!isConfigured || !supabase) return result;

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user.id !== userId) {
    throw new Error('登录会话无效，游客数据未合并');
  }

  if (legacyTempUserId) {
    const { error } = await supabase.rpc('claim_legacy_temp_user_data', {
      p_temp_user_id: legacyTempUserId,
    });
    // The compatibility RPC is introduced by the security migration. Keep the
    // local merge working when the app is upgraded before the migration runs.
    if (!error) result.legacyClaimed = true;
  }

  if (snapshot.items.length > 0) {
    const { data: existingItems, error: existingError } = await supabase
      .from('clothing_items')
      .select('name,category,sub_category,warmth_level')
      .eq('user_id', userId);
    if (existingError) throw existingError;

    const signatures = new Set(
      (existingItems || []).map((item: any) =>
        `${item.name}|${item.category}|${item.sub_category}|${item.warmth_level}`,
      ),
    );
    const rows = snapshot.items
      .filter(item => !signatures.has(`${item.name}|${item.category}|${item.subCategory}|${item.warmthLevel}`))
      .map(item => ({
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
        created_at: item.createdAt || new Date().toISOString(),
        user_id: userId,
        temp_user_id: null,
      }));

    if (rows.length > 0) {
      const { error } = await supabase.from('clothing_items').insert(rows);
      if (error) throw error;
      result.clothing = rows.length;
    }
  }

  if (snapshot.history.length > 0) {
    const { data: existingHistory, error: existingError } = await supabase
      .from('outfit_history')
      .select('worn_at,location_name')
      .eq('user_id', userId);
    if (existingError) throw existingError;

    const signatures = new Set(
      (existingHistory || []).map((entry: any) => `${entry.worn_at}|${entry.location_name}`),
    );
    const rows = snapshot.history
      .filter(entry => !signatures.has(`${entry.wornAt}|${entry.locationName}`))
      .map(entry => ({
        items: entry.items,
        weather_data: entry.weatherData,
        location_name: entry.locationName,
        scene: entry.scene,
        run_type: entry.runType,
        comfort_rating: entry.comfortRating,
        thermal_feedback: entry.thermalFeedback,
        notes: entry.notes,
        worn_at: entry.wornAt,
        created_at: entry.createdAt,
        user_id: userId,
        temp_user_id: null,
      }));

    if (rows.length > 0) {
      const { error } = await supabase.from('outfit_history').insert(rows);
      if (error) throw error;
      result.history = rows.length;
    }
  }

  if (snapshot.preferences) {
    const { data: existingPreferences, error: existingError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    if (existingError) throw existingError;

    if (!existingPreferences?.length) {
      const prefs = snapshot.preferences;
      const { error } = await supabase.from('user_preferences').insert({
        location: prefs.location,
        default_run_type: prefs.defaultRunType,
        commute_target_temp: prefs.commuteTargetTemp,
        easy_run_target_temp: prefs.easyRunTargetTemp,
        long_run_target_temp: prefs.longRunTargetTemp,
        interval_run_target_temp: prefs.intervalRunTargetTemp,
        default_scene: prefs.defaultScene,
        user_id: userId,
        temp_user_id: null,
      });
      if (error) throw error;
      result.preferences = 1;
    }
  }

  return result;
}

// ============================================
// Outfit Share API
// ============================================

export interface ShareData {
  id: string;
  outfit: any;
  weather: any;
  location: string;
  createdAt: string;
}

export async function saveOutfitShare(shareData: Omit<ShareData, 'id'>): Promise<ShareData> {
  const { userId } = getUserContext();
  
  if (!isConfigured || !supabase || !userId) {
    // Fallback to localStorage in demo mode
    const id = `share_${Date.now()}`;
    const data = { ...shareData, id };
    localStorage.setItem(id, JSON.stringify(data));
    return data;
  }
  
  const insertData: any = {
    outfit_data: shareData.outfit,
    weather_data: shareData.weather,
    location: shareData.location,
    created_at: shareData.createdAt,
  };
  
  insertData.user_id = userId;
  insertData.temp_user_id = null;
  
  const { data, error } = await supabase
    .from('outfit_shares')
    .insert([insertData])
    .select()
    .limit(1);
  
  if (error) {
    console.error('saveOutfitShare error:', error);
    throw error;
  }
  
  const record = first(data as any[]);
  if (!record) throw new Error('Insert failed');
  
  return {
    id: record.id,
    outfit: record.outfit_data,
    weather: record.weather_data,
    location: record.location,
    createdAt: record.created_at,
  };
}

export async function getOutfitShare(id: string): Promise<ShareData | null> {
  if (!isConfigured || !supabase) {
    // Fallback to localStorage in demo mode
    const stored = localStorage.getItem(id);
    return stored ? JSON.parse(stored) : null;
  }
  
  const { data, error } = await supabase.rpc('get_outfit_share', { p_id: id });
  
  if (error) {
    console.error('getOutfitShare error:', error);
    return null;
  }

  return data ? data as ShareData : null;
}
