// 用户管理模块 - 支持匿名用户和注册用户

import { supabase } from './supabase';

const TEMP_USER_ID_KEY = 'temp_user_id';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';

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

// 注册新用户（邮箱密码）
export async function registerUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('注册失败');
    
    // 迁移临时用户数据
    const { tempUserId } = getCurrentUser();
    if (tempUserId) {
      await migrateTempUserData(tempUserId, data.user.id);
      localStorage.removeItem(TEMP_USER_ID_KEY);
    }
    
    // 保存 userId 和 email
    localStorage.setItem(USER_ID_KEY, data.user.id);
    localStorage.setItem(USER_EMAIL_KEY, email);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 登录
export async function loginUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('登录失败');
    
    // 如果有临时数据，提示合并（这里简单处理：保留登录用户的数据）
    const { tempUserId } = getCurrentUser();
    if (tempUserId) {
      // 可选：提示用户是否合并数据
      // 暂时直接清除临时 ID
      localStorage.removeItem(TEMP_USER_ID_KEY);
    }
    
    localStorage.setItem(USER_ID_KEY, data.user.id);
    localStorage.setItem(USER_EMAIL_KEY, email);
    
    return { success: true };
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

// 迁移临时用户数据到注册用户
async function migrateTempUserData(tempUserId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('migrate_temp_user_data', {
    p_temp_user_id: tempUserId,
    p_user_id: userId,
  });
  
  if (error) {
    console.error('Failed to migrate temp user data:', error);
  }
}

// 获取用户显示信息
export function getUserDisplayInfo(): { type: 'guest' | 'registered'; id: string } {
  const { tempUserId, userId } = getCurrentUser();
  if (userId) {
    return { type: 'registered', id: userId };
  }
  return { type: 'guest', id: tempUserId || 'unknown' };
}
