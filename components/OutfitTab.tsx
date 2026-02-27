'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, RefreshCw, ChevronUp } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences } from '@/types';
import { getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences } from '@/lib/supabase';
import ClothingCard from './ClothingCard';

interface OutfitTabProps {
  weather?: WeatherData | null;
}

export default function OutfitTab({ weather: propWeather }: OutfitTabProps) {
  const { t } = useTranslation();
  const [scene, setScene] = useState<OutfitScene>('commute');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [wardrobe, setWardrobe] = useState<{
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    socks: ClothingItem[];
    shoes: ClothingItem[];
  }>({ tops: [], bottoms: [], socks: [], shoes: [] });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [replacingItem, setReplacingItem] = useState<'top' | 'bottom' | 'socks' | 'shoes' | null>(null);

  useEffect(() => {
    setWeather(propWeather || getMockWeather());
  }, [propWeather]);

  const loadData = useCallback(async () => {
    if (!weather) return;
    
    try {
      setLoading(true);
      const prefs = await getUserPreferences();
      setPreferences(prefs);
      
      const items = await getClothingItems();
      const wardrobeData = {
        tops: items.filter(i => i.category === 'top'),
        bottoms: items.filter(i => i.category === 'bottom'),
        socks: items.filter(i => i.category === 'socks'),
        shoes: items.filter(i => i.category === 'shoes'),
      };
      setWardrobe(wardrobeData);
      
      if (items.length > 0) {
        const rec = generateRecommendation(
          wardrobeData,
          weather,
          prefs || getDefaultPreferences(),
          scene
        );
        setRecommendation(rec);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [weather, scene]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDefaultPreferences = (): UserPreferences => ({
    id: 'default',
    location: '上海',
    commuteDistance: 5,
    runDistance: 5,
    coldSensitivity: 3,
    hotSensitivity: 3,
    sweatLevel: 'medium',
    windSensitivity: true,
    rainPreference: 'avoid',
  });

  const generateNewRecommendation = useCallback(() => {
    if (!weather || wardrobe.tops.length === 0) return;
    const rec = generateRecommendation(wardrobe, weather, preferences || getDefaultPreferences(), scene);
    setRecommendation(rec);
  }, [weather, wardrobe, preferences, scene]);

  const handleReplace = (category: 'top' | 'bottom' | 'socks' | 'shoes') => {
    setReplacingItem(category);
    setShowAlternatives(true);
  };

  const selectAlternative = (item: ClothingItem) => {
    if (!recommendation || !replacingItem) return;
    setRecommendation({
      ...recommendation,
      outfit: { ...recommendation.outfit, [replacingItem]: item },
    });
    setShowAlternatives(false);
    setReplacingItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen pb-24">
        <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (wardrobe.tops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white animate-fade-in px-5">
        <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-6">
          <span className="text-5xl">👕</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('outfit.emptyWardrobe')}</h3>
        <p className="text-white/50 text-center max-w-xs text-sm">
          {t('outfit.emptyWardrobeDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* ========== 天气区域 ========== */}
      <div className="pt-14 pb-6 px-5">
        {/* 位置 */}
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={18} className="text-white/70" />
          <span className="text-white/80 text-lg font-medium">
            {weather?.cityName || preferences?.location || t('status.locating')}
          </span>
        </div>

        {/* 大温度 */}
        {weather && (
          <div className="mb-4">
            <div className="temp-display text-[130px] text-white leading-none tracking-tight">
              {weather.temp}°
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-white/80 text-2xl">{weather.description}</div>
                <div className="text-white/50 text-base">
                  {t('weather.tempHigh')} {weather.temp + 3}° · {t('weather.tempLow')} {weather.temp - 5}°
                </div>
              </div>
              <div className="text-6xl animate-pulse-slow">
                {weather.isRaining ? '🌧️' : weather.weatherCode >= 801 ? '☁️' : '☀️'}
              </div>
            </div>
          </div>
        )}

        {/* 展开详情 */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          <span>{showDetails ? '收起' : '天气详情'}</span>
          <ChevronUp size={16} className={`transition-transform ${showDetails ? '' : 'rotate-180'}`} />
        </button>

        {showDetails && weather && (
          <div className="glass-card mt-4 p-5 grid grid-cols-3 gap-4 animate-fade-in">
            <WeatherDetail icon="💧" label={t('weather.humidity')} value={`${weather.humidity}%`} />
            <WeatherDetail icon="💨" label={t('weather.windSpeed')} value={`${Math.round(weather.windSpeed)}m/s`} />
            <WeatherDetail icon="🌡️" label={t('weather.feelsLike')} value={`${weather.feelsLike}°`} />
          </div>
        )}
      </div>

      {/* ========== 穿搭展示区域 (3D占位) ========== */}
      <div className="px-5 mb-6">
        <div className="glass-card h-64 flex flex-col items-center justify-center relative overflow-hidden">
          {/* 3D 场景占位 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center animate-float">
              <span className="text-6xl">👔</span>
            </div>
          </div>
          
          {/* 推荐理由 */}
          {recommendation && (
            <div className="absolute bottom-4 left-4 right-4 glass-card p-4">
              <p className="text-sm text-white/80 leading-relaxed">
                {recommendation.reasoning}
              </p>
            </div>
          )}
          
          {/* 场景切换按钮 */}
          <div className="absolute top-4 right-4 flex gap-2">
            <SceneButton 
              active={scene === 'commute'} 
              onClick={() => setScene('commute')}
              icon={<Navigation size={16} />}
              label={t('scene.commute')}
            />
            <SceneButton 
              active={scene === 'running'} 
              onClick={() => setScene('running')}
              icon={<span>🏃</span>}
              label={t('scene.running')}
            />
          </div>
        </div>
      </div>

      {/* ========== 穿搭详情区域 ========== */}
      <div className="px-5 space-y-4">
        <div className="section-header">
          <span>{t('outfit.todayOutfit') || '今日穿搭'}</span>
        </div>
        
        {recommendation && (
          <div className="grid grid-cols-2 gap-3">
            <ClothingCard item={recommendation.outfit.top} label={t('clothing.top')} onReplace={() => handleReplace('top')} />
            <ClothingCard item={recommendation.outfit.bottom} label={t('clothing.bottom')} onReplace={() => handleReplace('bottom')} />
            <ClothingCard item={recommendation.outfit.socks} label={t('clothing.socks')} onReplace={() => handleReplace('socks')} />
            <ClothingCard item={recommendation.outfit.shoes} label={t('clothing.shoes')} onReplace={() => handleReplace('shoes')} />
          </div>
        )}

        <button
          onClick={generateNewRecommendation}
          className="w-full primary-button flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          {t('outfit.refresh')}
        </button>
      </div>

      {/* 备选方案弹窗 */}
      {showAlternatives && replacingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4">
          <div className="glass-card w-full max-w-md max-h-[60vh] overflow-hidden rounded-3xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('outfit.select')} {t(`clothing.${replacingItem}`)}</h3>
              <button
                onClick={() => setShowAlternatives(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[40vh] space-y-2">
              {recommendation?.alternatives?.[replacingItem]?.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectAlternative(item)}
                  className="w-full p-3 flex items-center gap-4 hover:bg-white/5 rounded-2xl transition-colors text-left"
                >
                  <span className="text-3xl">
                    {item.category === 'top' ? '👕' : item.category === 'bottom' ? '👖' : item.category === 'socks' ? '🧦' : '👟'}
                  </span>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm opacity-50">{t(`types.${item.subCategory}`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherDetail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-white/50 mb-0.5">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function SceneButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-button px-4 py-2 flex items-center gap-2 text-sm font-medium ${
        active ? '!bg-white/25 !border-white/40 text-white' : 'text-white/70'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
