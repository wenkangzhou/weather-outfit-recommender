'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shirt, User } from 'lucide-react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/components/I18nProvider';
import OutfitTab from '@/components/OutfitTab';
import SettingsTab from '@/components/SettingsTab';
import { getCurrentWeather, getMockWeather } from '@/lib/weather';
import { getUserPreferences } from '@/lib/supabase';
import { useAppStore, useActualTheme } from '@/store/appStore';
import { WeatherData, UserPreferences } from '@/types';

type Tab = 'outfit' | 'settings';

function AppContent() {
  const { t } = useTranslation();
  const actualTheme = useActualTheme();
  
  const [activeTab, setActiveTab] = useState<Tab>('outfit');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [bgClass, setBgClass] = useState('bg-weather-sunny');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getUserPreferences().then(setPreferences).catch(() => setPreferences(null));
  }, []);

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
          <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${bgClass} transition-all duration-1000`}>
      <div className="relative min-h-screen max-w-md mx-auto">
        {activeTab === 'outfit' ? <OutfitTab weather={weather} /> : <SettingsTab />}

        {/* 液态玻璃 Tab Bar */}
        <nav className="tab-bar">
          <TabButton 
            active={activeTab === 'outfit'} 
            onClick={() => setActiveTab('outfit')}
            icon={<Shirt size={24} strokeWidth={1.5} />}
            label={t('nav.outfit')}
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<User size={24} strokeWidth={1.5} />}
            label={t('nav.settings')}
          />
        </nav>
      </div>
    </main>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`tab-button ${active ? 'active' : ''}`}
    >
      <span className="tab-button-icon">{icon}</span>
      <span className="tab-button-label">{label}</span>
    </button>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}
