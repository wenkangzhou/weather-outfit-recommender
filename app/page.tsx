'use client';

import { useState, useEffect } from 'react';
import { Shirt, User } from 'lucide-react';
import OutfitTab from '@/components/OutfitTab';
import SettingsTab from '@/components/SettingsTab';
import { getCurrentWeather, getMockWeather } from '@/lib/weather';
import { WeatherData } from '@/types';

type Tab = 'outfit' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('outfit');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [bgClass, setBgClass] = useState('bg-weather-sunny');

  useEffect(() => {
    // Load weather for background
    const loadWeather = async () => {
      try {
        const data = await getCurrentWeather('北京');
        setWeather(data);
        setBgClass(getWeatherBgClass(data));
      } catch {
        const mock = getMockWeather();
        setWeather(mock);
        setBgClass(getWeatherBgClass(mock));
      }
    };
    loadWeather();
  }, []);

  const getWeatherBgClass = (w: WeatherData): string => {
    if (w.isRaining) return 'bg-weather-rainy';
    if (w.weatherCode >= 801) return 'bg-weather-cloudy';
    if (new Date().getHours() < 6 || new Date().getHours() > 20) return 'bg-weather-night';
    return 'bg-weather-sunny';
  };

  return (
    <main className={`min-h-screen ${bgClass} transition-all duration-1000`}>
      {/* Background overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
      
      {/* Content container - mobile first */}
      <div className="relative min-h-screen max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
        {/* Main content area */}
        <div className="pb-24 px-4 pt-6">
          {activeTab === 'outfit' ? <OutfitTab weather={weather} /> : <SettingsTab />}
        </div>

        {/* Bottom Navigation - Glassmorphism */}
        <nav className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:mt-8">
          <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl px-4 pb-safe">
            <div className="glass-card mb-4 md:mb-8 flex p-1.5">
              <button
                onClick={() => setActiveTab('outfit')}
                className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === 'outfit'
                    ? 'bg-white/20 shadow-lg'
                    : 'hover:bg-white/10'
                }`}
              >
                <Shirt size={20} className={activeTab === 'outfit' ? 'text-white' : 'text-white/60'} />
                <span className={`text-sm font-medium ${activeTab === 'outfit' ? 'text-white' : 'text-white/60'}`}>
                  今日穿搭
                </span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === 'settings'
                    ? 'bg-white/20 shadow-lg'
                    : 'hover:bg-white/10'
                }`}
              >
                <User size={20} className={activeTab === 'settings' ? 'text-white' : 'text-white/60'} />
                <span className={`text-sm font-medium ${activeTab === 'settings' ? 'text-white' : 'text-white/60'}`}>
                  我的
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </main>
  );
}
