'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Shirt, Settings } from 'lucide-react';
import OutfitTab from '@/components/OutfitTab';
import SettingsTab from '@/components/SettingsTab';
import { cacheWeather, getCachedWeather, getCurrentPosition, getCurrentWeather, getMockWeather, getWeatherByCity, getWeatherByCoords } from '@/lib/weather';
import { getUserPreferences, saveUserPreferences } from '@/lib/supabase';
import { getOrCreateTempUserId } from '@/lib/user';
import { WeatherData, UserPreferences } from '@/types';

type Tab = 'outfit' | 'settings';

function getWeatherBgClass(weather: WeatherData): string {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;

  if (isNight) return 'bg-weather-night';
  if (weather.isRaining) return 'bg-weather-rainy';
  if (weather.weatherCode >= 801) return 'bg-weather-cloudy';
  return 'bg-weather-sunny';
}

function AppContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  
  // 从 URL 读取 tab 参数
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl === 'settings' ? 'settings' : 'outfit');
  const [outfitVisited, setOutfitVisited] = useState(tabFromUrl !== 'settings');
  const [settingsVisited, setSettingsVisited] = useState(tabFromUrl === 'settings');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [bgClass, setBgClass] = useState('bg-weather-sunny');
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const skipNextWeatherReloadRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const cachedWeather = getCachedWeather();
    if (cachedWeather) {
      setWeather(cachedWeather);
      setBgClass(getWeatherBgClass(cachedWeather));
    }
    // 初始化临时用户 ID（如果没有则创建）
    getOrCreateTempUserId();
    getUserPreferences()
      .then(setPreferences)
      .catch(() => setPreferences(null))
      .finally(() => setPreferencesLoaded(true));
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
    if (tab === 'outfit') setOutfitVisited(true);
    if (tab === 'settings') setSettingsVisited(true);
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
    if (!preferencesLoaded || !outfitVisited) return;
    if (skipNextWeatherReloadRef.current) {
      skipNextWeatherReloadRef.current = false;
      return;
    }

    const loadWeather = async () => {
      if (!getCachedWeather() && !preferences?.location) {
        const fallback = getMockWeather();
        setWeather(fallback);
        setBgClass(getWeatherBgClass(fallback));
      }
      try {
        const data = await getCurrentWeather(preferences?.location);
        setWeather(data);
        setBgClass(getWeatherBgClass(data));
        cacheWeather(data);
      } catch {
        const mock = getMockWeather();
        setWeather(mock);
        setBgClass(getWeatherBgClass(mock));
      }
    };
    loadWeather();
  }, [outfitVisited, preferences?.location, preferencesLoaded]);

  const persistLocation = async (location: string) => {
    const nextPreferences: UserPreferences = {
      id: preferences?.id || 'local',
      location,
      defaultRunType: preferences?.defaultRunType || 'easy',
      commuteTargetTemp: preferences?.commuteTargetTemp ?? 24,
      easyRunTargetTemp: preferences?.easyRunTargetTemp ?? 12,
      longRunTargetTemp: preferences?.longRunTargetTemp ?? 10,
      intervalRunTargetTemp: preferences?.intervalRunTargetTemp ?? 8,
      defaultScene: preferences?.defaultScene || 'commute',
    };
    const saved = await saveUserPreferences(nextPreferences);
    setPreferences({ ...nextPreferences, id: saved.id || nextPreferences.id });
  };

  const handleCitySelect = async (city: string) => {
    const data = await getWeatherByCity(city);
    const localizedWeather = { ...data, cityName: city };
    setWeather(localizedWeather);
    setBgClass(getWeatherBgClass(localizedWeather));
    cacheWeather(localizedWeather);
    skipNextWeatherReloadRef.current = true;
    try {
      await persistLocation(city);
    } catch (error) {
      skipNextWeatherReloadRef.current = false;
      throw error;
    }
  };

  const handleLocate = async () => {
    const position = await getCurrentPosition();
    const data = await getWeatherByCoords(position.coords.latitude, position.coords.longitude);
    setWeather(data);
    setBgClass(getWeatherBgClass(data));
    cacheWeather(data);
    if (data.cityName) {
      skipNextWeatherReloadRef.current = true;
      try {
        await persistLocation(data.cityName);
      } catch (error) {
        skipNextWeatherReloadRef.current = false;
        throw error;
      }
    }
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
        {outfitVisited && (
          <div className={activeTab === 'outfit' ? 'block' : 'hidden'}>
            <OutfitTab
              weather={weather}
              isActive={activeTab === 'outfit'}
              onCitySelect={handleCitySelect}
              onLocate={handleLocate}
            />
          </div>
        )}
        {settingsVisited && (
          <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
            <SettingsTab />
          </div>
        )}

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
      aria-pressed={active}
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
    <Suspense fallback={<AppLoading />}>
      <AppContent />
    </Suspense>
  );
}
