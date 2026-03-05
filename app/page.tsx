'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Shirt, Settings } from 'lucide-react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/components/I18nProvider';
import OutfitTab from '@/components/OutfitTab';
import SettingsTab from '@/components/SettingsTab';
import { getCurrentWeather, getMockWeather } from '@/lib/weather';
import { getUserPreferences } from '@/lib/supabase';
import { getOrCreateTempUserId } from '@/lib/user';
import { useActualTheme } from '@/store/appStore';
import { WeatherData, UserPreferences } from '@/types';

type Tab = 'outfit' | 'settings';

function AppContent() {
  const { t } = useTranslation();
  const actualTheme = useActualTheme();
  const searchParams = useSearchParams();
  
  // 从 URL 读取 tab 参数
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl === 'settings' ? 'settings' : 'outfit');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [bgClass, setBgClass] = useState('bg-weather-sunny');
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 初始化临时用户 ID（如果没有则创建）
    getOrCreateTempUserId();
    getUserPreferences().then(setPreferences).catch(() => setPreferences(null));
  }, []);

  // 监听登录状态变化，显示刷新 loading
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id' || e.key === 'temp_user_id') {
        // 用户登录/切换，显示 loading
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1500);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // 切换 tab 时更新 URL（可选，保持 URL 同步）
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // 使用 replaceState 避免添加历史记录
    const url = new URL(window.location.href);
    if (tab === 'settings') {
      url.searchParams.set('tab', 'settings');
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const data = await getCurrentWeather(preferences?.location);
        setWeather(data);
        setBgClass(getWeatherBgClass(data));
      } catch {
        const mock = getMockWeather();
        setWeather(mock);
        setBgClass(getWeatherBgClass(mock));
      }
    };
    loadWeather();
  }, [preferences?.location]);

  const getWeatherBgClass = (w: WeatherData): string => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;
    
    if (isNight) return 'bg-weather-night';
    if (w.isRaining) return 'bg-weather-rainy';
    if (w.weatherCode >= 801) return 'bg-weather-cloudy';
    return 'bg-weather-sunny';
  };

  if (!mounted) {
    return (
      <main className={`min-h-screen ${bgClass}`}>
        <div className="h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${bgClass} transition-all duration-1000`}>
      {/* 全局刷新 Loading */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">数据刷新中...</span>
          </div>
        </div>
      )}
      <div className="relative min-h-screen max-w-md mx-auto">
        {/* 使用 CSS 控制显示，避免组件卸载重新加载 */}
        <div className={activeTab === 'outfit' ? 'block' : 'hidden'}>
          <OutfitTab weather={weather} isActive={activeTab === 'outfit'} />
        </div>
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <SettingsTab />
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <NavItem 
            active={activeTab === 'outfit'} 
            onClick={() => handleTabChange('outfit')}
            icon={<Shirt size={20} strokeWidth={1.5} />}
            label={t('nav.outfit')}
          />
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => handleTabChange('settings')}
            icon={<Settings size={20} strokeWidth={1.5} />}
            label={t('nav.settings')}
          />
        </nav>
      </div>
    </main>
  );
}

function NavItem({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`nav-item ${active ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Loading fallback for Suspense
function AppLoading() {
  return (
    <main className="min-h-screen bg-weather-sunny">
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Suspense fallback={<AppLoading />}>
          <AppContent />
        </Suspense>
      </I18nProvider>
    </ThemeProvider>
  );
}
