import { createClient } from '@supabase/supabase-js';
import { ClothingItem, Outfit, UserPreferences, ClothingCategory, ClothingSubCategory, OutfitHistoryItem, WeatherData } from '@/types';
import { getCurrentUser, getOrCreateTempUserId } from './user';

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
  const { tempUserId, userId } = getCurrentUser();
  return { tempUserId, userId };
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
}

interface UserPreferencesRow {
  id: string;
  location: string;
  default_run_type: 'easy' | 'long' | 'interval';
  user_id?: string;
  temp_user_id?: string;
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
  notes?: string;
  scene?: 'commute' | 'running';
  run_type?: 'easy' | 'long' | 'interval';
}

// API functions
export async function getClothingItems(): Promise<ClothingItem[]> {
  if (!isConfigured || !supabase) return getDemoItems();
  
  const { tempUserId, userId } = getUserContext();
  
  let query = supabase
    .from('clothing_items')
    .select('*')
    .order('created_at', { ascending: false });
  
  // 根据用户类型过滤
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (tempUserId) {
    query = query.eq('temp_user_id', tempUserId);
  }
  
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
  }));
}

export async function addClothingItem(item: Omit<ClothingItem, 'id' | 'createdAt'>): Promise<ClothingItem> {
  const { tempUserId, userId } = getUserContext();
  
  if (!isConfigured || !supabase) {
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
  };
  
  // 添加用户标识
  if (userId) {
    insertData.user_id = userId;
  } else if (tempUserId) {
    insertData.temp_user_id = tempUserId;
  }
  
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
  };
}

export async function updateClothingItem(
  id: string, 
  updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
): Promise<ClothingItem> {
  const { tempUserId, userId } = getUserContext();
  
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
  
  let query = supabase
    .from('clothing_items')
    .update(dbUpdates)
    .eq('id', id);
  
  // 添加用户权限检查
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (tempUserId) {
    query = query.eq('temp_user_id', tempUserId);
  }
  
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
  };
}

export async function deleteClothingItem(id: string): Promise<void> {
  const { tempUserId, userId } = getUserContext();
  
  if (!isConfigured || !supabase) {
    setDemoItems(getDemoItems().filter(item => item.id !== id));
    return;
  }
  
  let query = supabase
    .from('clothing_items')
    .delete()
    .eq('id', id);
  
  // 添加用户权限检查
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (tempUserId) {
    query = query.eq('temp_user_id', tempUserId);
  }
  
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
  const { tempUserId, userId } = getUserContext();
  
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
  
  const insertData: any = {
    items: params.items,
    weather_data: params.weatherData,
    location_name: params.locationName,
    scene: params.scene,
    run_type: params.runType,
    worn_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  
  // 添加用户标识
  if (userId) {
    insertData.user_id = userId;
  } else if (tempUserId) {
    insertData.temp_user_id = tempUserId;
  }
  
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
    notes: record.notes,
  };
}

export async function getOutfitHistory(): Promise<OutfitHistoryItem[]> {
  const { tempUserId, userId } = getUserContext();
  console.log('[getOutfitHistory] User context:', { userId, tempUserId });
  
  if (!isConfigured || !supabase) {
    console.log('[getOutfitHistory] Demo mode');
    return getDemoOutfitHistory().sort((a, b) => 
      new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime()
    );
  }
  
  let query = supabase
    .from('outfit_history')
    .select('*')
    .order('worn_at', { ascending: false });
  
  // 根据用户类型过滤
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (tempUserId) {
    query = query.eq('temp_user_id', tempUserId);
  }
  
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
    notes: record.notes,
  }));
}

export async function deleteOutfitHistory(id: string): Promise<void> {
  const { tempUserId, userId } = getUserContext();
  
  console.log('[deleteOutfitHistory] Context:', { id, userId, tempUserId });
  
  if (!isConfigured || !supabase) {
    console.log('[deleteOutfitHistory] Demo mode');
    const history = getDemoOutfitHistory().filter(item => item.id !== id);
    setDemoOutfitHistory(history);
    return;
  }
  
  // 先查询记录完整信息
  const { data: record, error: fetchError } = await supabase
    .from('outfit_history')
    .select('*')
    .eq('id', id)
    .single();
  
  console.log('[deleteOutfitHistory] Record found:', { 
    id: record?.id,
    user_id: record?.user_id, 
    temp_user_id: record?.temp_user_id,
    fetchError 
  });
  
  if (fetchError || !record) {
    throw new Error('记录不存在或无权访问');
  }
  
  // 检查权限
  const isOwner = (userId && record.user_id === userId) || 
                  (tempUserId && record.temp_user_id === tempUserId);
  
  console.log('[deleteOutfitHistory] Permission check:', { 
    isOwner,
    record_user_id: record.user_id, 
    record_temp_user_id: record.temp_user_id,
    current_user_id: userId,
    current_temp_id: tempUserId
  });
  
  if (!isOwner) {
    throw new Error('无权限删除此记录');
  }
  
  // 尝试使用 RPC 函数删除（绕过 RLS）
  try {
    console.log('[deleteOutfitHistory] Trying RPC delete...');
    
    // 方法1: 使用 RPC 函数（绕过 RLS）
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_outfit_history_by_id', {
      p_id: id
    });
    
    console.log('[deleteOutfitHistory] RPC result:', { rpcResult, rpcError });
    
    if (rpcError) {
      console.error('[deleteOutfitHistory] RPC error:', rpcError);
      throw rpcError;
    }
    
    if (!rpcResult) {
      console.warn('[deleteOutfitHistory] RPC returned false, record may not exist');
    }
    
    // 验证删除 - 使用 maybeSingle 避免 406 错误
    await new Promise(resolve => setTimeout(resolve, 200));
    const { data: checkData, error: checkError } = await supabase
      .from('outfit_history')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    console.log('[deleteOutfitHistory] Verify:', { checkData, checkError });
    
    if (checkData) {
      console.error('[deleteOutfitHistory] Record still exists after RPC delete');
      throw new Error('删除失败');
    }
    
    console.log('[deleteOutfitHistory] Successfully deleted');
  } catch (e) {
    console.error('[deleteOutfitHistory] Delete failed:', e);
    // 如果 RPC 失败，尝试标准删除（带 RLS 限制）
    const { error } = await supabase.from('outfit_history').delete().eq('id', id);
    if (error) {
      console.error('[deleteOutfitHistory] Standard delete also failed:', error);
    }
    throw e;
  }
}

export async function updateOutfitHistoryRating(
  id: string, 
  rating: number, 
  notes?: string
): Promise<void> {
  const { tempUserId, userId } = getUserContext();
  
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
  
  let query = supabase
    .from('outfit_history')
    .update(updates)
    .eq('id', id);
  
  // 添加用户权限检查
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (tempUserId) {
    query = query.eq('temp_user_id', tempUserId);
  }
  
  const { error } = await query;
  
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
  const { tempUserId, userId } = getUserContext();
  
  if (!isConfigured || !supabase) return getDemoPrefs();
  
  let query = supabase
    .from('user_preferences')
    .select('*');
  
  // 根据用户类型过滤
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (tempUserId) {
    query = query.eq('temp_user_id', tempUserId);
  } else {
    return getDemoPrefs();
  }
  
  const { data, error } = await query.limit(1);
  
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
  const { tempUserId, userId } = getUserContext();
  
  if (!isConfigured || !supabase) {
    const newPrefs = { ...prefs, id: 'demo_prefs' } as UserPreferences;
    setDemoPrefs(newPrefs);
    return newPrefs;
  }
  
  // 检查是否已存在
  let existingQuery = supabase
    .from('user_preferences')
    .select('id');
  
  if (userId) {
    existingQuery = existingQuery.eq('user_id', userId);
  } else if (tempUserId) {
    existingQuery = existingQuery.eq('temp_user_id', tempUserId);
  }
  
  const { data: existingData } = await existingQuery.limit(1);
  const existing = first(existingData as { id: string }[]);
  
  const dbPrefs: any = {
    location: prefs.location,
    default_run_type: prefs.defaultRunType,
  };
  
  // 添加用户标识
  if (userId) {
    dbPrefs.user_id = userId;
  } else if (tempUserId) {
    dbPrefs.temp_user_id = tempUserId;
  }
  
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
