// 用户管理模块 - 支持匿名用户和注册用户

import { supabase } from './supabase';

const TEMP_USER_ID_KEY = 'temp_user_id';
const LEGACY_TEMP_USER_ID_KEY = 'legacy_temp_user_id';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';
const GUEST_DATA_KEYS = ['demo_clothing_items', 'demo_outfit_history', 'demo_preferences'] as const;

export interface AuthResult {
  success: boolean;
  error?: string;
  mergedItems?: number;
  pendingConfirmation?: boolean;
}

// 生成随机 ID
function generateTempUserId(): string {
  return 'temp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 获取当前用户标识
export function getCurrentUser(): { tempUserId: string | null; userId: string | null } {
  if (typeof window === 'undefined') {
    return { tempUserId: null, userId: null };
  }
  
  // 优先检查是否已登录（注册用户）
  const userId = localStorage.getItem(USER_ID_KEY);
  if (userId) {
    return { tempUserId: null, userId };
  }
  
  // 否则使用临时用户 ID
  let tempUserId = localStorage.getItem(TEMP_USER_ID_KEY);
  if (!tempUserId) {
    tempUserId = generateTempUserId();
    localStorage.setItem(TEMP_USER_ID_KEY, tempUserId);
  }
  
  return { tempUserId, userId: null };
}

// 获取或创建临时用户 ID
export function getOrCreateTempUserId(): string {
  const { tempUserId } = getCurrentUser();
  if (tempUserId) return tempUserId;
  
  // 如果已经有 userId，不需要 tempUserId
  const newTempId = generateTempUserId();
  localStorage.setItem(TEMP_USER_ID_KEY, newTempId);
  return newTempId;
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  const { userId } = getCurrentUser();
  return !!userId;
}

// 获取当前登录用户的邮箱（前6位）
export async function getUserEmail(): Promise<string | null> {
  try {
    // 先从 session 获取
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (session?.user?.email) {
      return session.user.email.substring(0, 6);
    }
    
    // 如果 session 获取失败，尝试从 localStorage 的 user_id 推断（备用）
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) return null;
    
    // 尝试获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user?.email) {
      return user.email.substring(0, 6);
    }
    
    return null;
  } catch (e) {
    console.error('getUserEmail error:', e);
    return null;
  }
}

// 获取当前用户信息（同步，从 localStorage）
export function getUserInfo(): { type: 'guest' | 'registered'; display: string } {
  const { tempUserId, userId } = getCurrentUser();
  
  if (userId) {
    // 注册用户，优先显示邮箱前6位
    const email = localStorage.getItem(USER_EMAIL_KEY);
    if (email) {
      return { type: 'registered', display: email.substring(0, 6) };
    }
    // 备用：显示 userId 前6位
    return { type: 'registered', display: userId.substring(0, 6) };
  }
  
  // 访客
  return { type: 'guest', display: '访客' };
}

function parseLocalValue<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function captureLocalGuestData() {
  return {
    items: parseLocalValue<any[]>('demo_clothing_items', []),
    history: parseLocalValue<any[]>('demo_outfit_history', []),
    preferences: parseLocalValue<any | null>('demo_preferences', null),
  };
}

async function finishAuthenticatedLogin(userId: string, email: string, legacyTempUserId: string | null) {
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(USER_EMAIL_KEY, email);

  const snapshot = captureLocalGuestData();
  try {
    const { mergeLocalGuestDataIntoAccount } = await import('./supabase');
    const merged = await mergeLocalGuestDataIntoAccount(snapshot, userId, legacyTempUserId);
    GUEST_DATA_KEYS.forEach(key => localStorage.removeItem(key));

    if (merged.legacyClaimed) {
      localStorage.removeItem(TEMP_USER_ID_KEY);
      localStorage.removeItem(LEGACY_TEMP_USER_ID_KEY);
    } else if (legacyTempUserId) {
      // Keep the opaque legacy id until the security migration is deployed.
      localStorage.setItem(LEGACY_TEMP_USER_ID_KEY, legacyTempUserId);
      localStorage.removeItem(TEMP_USER_ID_KEY);
    }

    return merged.clothing + merged.history + merged.preferences;
  } catch (error) {
    console.error('Guest data merge failed; local copy retained:', error);
    return 0;
  }
}

// 注册新用户（邮箱密码）
export async function registerUser(email: string, password: string): Promise<AuthResult> {
  const legacyTempUserId = localStorage.getItem(TEMP_USER_ID_KEY) || localStorage.getItem(LEGACY_TEMP_USER_ID_KEY);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('注册失败');
    
    if (!data.session) {
      return { success: true, pendingConfirmation: true };
    }

    const mergedItems = await finishAuthenticatedLogin(data.user.id, email, legacyTempUserId);
    return { success: true, mergedItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 登录
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const legacyTempUserId = localStorage.getItem(TEMP_USER_ID_KEY) || localStorage.getItem(LEGACY_TEMP_USER_ID_KEY);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('登录失败');
    
    const mergedItems = await finishAuthenticatedLogin(data.user.id, email, legacyTempUserId);
    return { success: true, mergedItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 登出
export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  // 生成新的临时 ID
  getOrCreateTempUserId();
}

// 获取用户显示信息
export function getUserDisplayInfo(): { type: 'guest' | 'registered'; id: string } {
  const { tempUserId, userId } = getCurrentUser();
  if (userId) {
    return { type: 'registered', id: userId };
  }
  return { type: 'guest', id: tempUserId || 'unknown' };
}
