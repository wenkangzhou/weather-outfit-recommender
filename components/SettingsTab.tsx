'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Shirt, History, ChevronRight, Timer, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { UserPreferences, RunType } from '@/types';
import { getUserPreferences, saveUserPreferences, getClothingItems, getOutfitHistory } from '@/lib/supabase';
import { isLoggedIn, getUserDisplayInfo, logoutUser, getUserEmail, getUserInfo } from '@/lib/user';
import { Card } from '@/components/ui/card';

const RUN_TYPE_OPTIONS: { type: RunType; label: string }[] = [
  { type: 'easy', label: '有氧跑' },
  { type: 'long', label: '长距离' },
  { type: 'interval', label: '间歇跑' },
];

export default function SettingsTab() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [defaultRunType, setDefaultRunType] = useState<RunType>('easy');
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [showRunTypePicker, setShowRunTypePicker] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userStatus, setUserStatus] = useState<'guest' | 'registered'>('guest');
  const [userDisplay, setUserDisplay] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // Check user status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getUserInfo();
      setUserStatus(info.type);
      setUserDisplay(info.display);
    }
  }, []);

  // Load preferences and counts
  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadData = async () => {
    setIsLoadingCounts(true);
    try {
      const [prefs, items, history] = await Promise.all([
        getUserPreferences(),
        getClothingItems(),
        getOutfitHistory()
      ]);
      
      if (prefs) {
        setPreferences(prefs);
        setDefaultRunType(prefs.defaultRunType || 'easy');
      }
      setWardrobeCount(items.length);
      setHistoryCount(history.length);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Auto-save when run type changes
  const handleRunTypeChange = useCallback(async (type: RunType) => {
    setDefaultRunType(type);
    if (preferences) {
      const newPrefs: UserPreferences = {
        ...preferences,
        defaultRunType: type,
      };
      await saveUserPreferences(newPrefs);
      setPreferences(newPrefs);
    }
    setShowRunTypePicker(false);
  }, [preferences]);

  if (!mounted) {
    return (
      <div className="min-h-screen pb-28">
        <div className="safe-area-header" />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      {/* Header - 刘海屏安全区域 */}
      <div className="safe-area-header" />

      <div className="px-5 space-y-6">
        {/* Account Section - 移到最上面 */}
        <section>
          <div className="settings-section-title">
            <User size={16} className="text-blue-500" />
            账户
          </div>
          
          {userStatus === 'guest' ? (
            <Card className="settings-card">
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  当前为访客模式，数据仅保存在当前设备。登录后可同步数据到云端。
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => setShowLoginModal(true)}
                >
                  登录 / 注册
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="settings-card">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">用户 {userDisplay}...</div>
                  <div className="text-sm text-muted-foreground">数据已同步到云端</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    await logoutUser();
                    setUserStatus('guest');
                    setUserDisplay('');
                  }}
                >
                  退出
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Quick Access - Full Width */}
        <section className="space-y-3">
          <QuickAccessRow 
            icon={<Shirt size={20} />}
            title={t('settings.myWardrobe')}
            count={isLoadingCounts ? undefined : wardrobeCount}
            unit={t('settings.items')}
            onClick={() => router.push('/wardrobe?from=settings')}
          />
          <QuickAccessRow 
            icon={<History size={20} />}
            title={t('settings.outfitHistory')}
            count={isLoadingCounts ? undefined : historyCount}
            unit={t('settings.records')}
            onClick={() => router.push('/history?from=settings')}
          />
        </section>

        {/* Appearance */}
        <section>
          <div className="settings-section-title">
            <Sun size={16} className="text-amber-500" />
            {t('settings.appearance')}
          </div>
          
          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.theme')}</div>
            <div className="options-row">
              <OptionButton 
                icon={<Monitor size={18} />}
                label={t('settings.system')}
                active={theme === 'system'}
                onClick={() => setTheme('system')}
              />
              <OptionButton 
                icon={<Sun size={18} />}
                label={t('settings.light')}
                active={theme === 'light'}
                onClick={() => setTheme('light')}
              />
              <OptionButton 
                icon={<Moon size={18} />}
                label={t('settings.dark')}
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />
            </div>
          </Card>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.language')}</div>
            <div className="options-row">
              <LangButton 
                label="中文"
                active={language === 'zh'}
                onClick={() => {
                  setLanguage('zh');
                  i18n.changeLanguage('zh');
                }}
              />
              <LangButton 
                label="English"
                active={language === 'en'}
                onClick={() => {
                  setLanguage('en');
                  i18n.changeLanguage('en');
                }}
              />
            </div>
          </Card>
        </section>

        {/* Account Section 已移到最上方 */}

        <div className="h-4" />
      </div>

      {/* Run Type Picker Modal */}
      {showRunTypePicker && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-end justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">选择默认课表</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowRunTypePicker(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className="p-3 space-y-2">
              {RUN_TYPE_OPTIONS.map((run) => (
                <button
                  key={run.type}
                  onClick={() => handleRunTypeChange(run.type)}
                  className={`w-full p-4 flex items-center justify-between rounded-xl transition-colors ${
                    defaultRunType === run.type 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      defaultRunType === run.type 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Timer size={18} />
                    </div>
                    <div className="font-medium">{run.label}</div>
                  </div>
                  {defaultRunType === run.type && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check size={14} className="text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={() => {
        setUserStatus('registered');
        const info = getUserInfo();
        setUserDisplay(info.display);
      }} />}
    </div>
  );
}

// ========== Components ==========

function QuickAccessRow({ icon, title, count, unit, onClick }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  unit: string;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-border/80 hover:bg-accent transition-all active:scale-[0.99]"
    >
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{title}</div>
        <div className="text-base font-medium tabular-nums h-6">
          {count === undefined ? (
            <span className="inline-block w-8 h-4 bg-muted rounded animate-pulse" />
          ) : (
            <>{count} <span className="text-sm font-normal text-muted-foreground">{unit}</span></>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </button>
  );
}

function OptionButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`option-button ${active ? 'active' : ''}`}
    >
      <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function LangButton({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`option-button ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  );
}

// Login Modal Component - 自动登录/注册
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('正在登录...');

    const { loginUser, registerUser } = await import('@/lib/user');
    
    // 先尝试登录
    const loginResult = await loginUser(email, password);
    
    if (loginResult.success) {
      setStatus('登录成功');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } else if (loginResult.error?.includes('Invalid login credentials')) {
      // 登录失败，可能是用户不存在，尝试注册
      setStatus('账号不存在，正在创建...');
      const registerResult = await registerUser(email, password);
      
      if (registerResult.success) {
        setStatus('注册成功，正在登录...');
        // 注册成功后自动登录
        const autoLoginResult = await loginUser(email, password);
        if (autoLoginResult.success) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else if (autoLoginResult.error?.includes('Email not confirmed')) {
          // 邮箱未验证，提示用户
          setError('注册成功！请查看邮箱完成验证，或联系管理员关闭邮箱验证。');
        } else {
          setError('注册成功但登录失败：' + autoLoginResult.error);
        }
      } else if (registerResult.error?.includes('already registered')) {
        // 用户已存在但刚才登录失败，可能是密码错误
        setError('该邮箱已存在，请检查密码是否正确');
      } else {
        setError(registerResult.error || '注册失败');
      }
    } else if (loginResult.error?.includes('Email not confirmed')) {
      setError('该邮箱未验证，请查看验证邮件或联系管理员关闭验证');
    } else {
      // 其他登录错误
      setError(loginResult.error || '登录失败');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center pt-20 px-4 animate-fade-in">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-medium">登录</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          
          {status && !error && (
            <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              {status}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '处理中...' : '进入'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            账号存在则登录，不存在则自动注册
          </p>
        </form>
      </Card>
    </div>
  );
}

