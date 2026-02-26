'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, Droplets, Wind, RefreshCw, Sun, Umbrella } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences } from '@/types';
import { getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences } from '@/lib/supabase';
import ClothingCard from './ClothingCard';
import SceneBadge from './SceneBadge';

interface OutfitTabProps {
  weather?: WeatherData | null;
}

export default function OutfitTab({ weather: propWeather }: OutfitTabProps) {
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
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [replacingItem, setReplacingItem] = useState<'top' | 'bottom' | 'socks' | 'shoes' | null>(null);

  useEffect(() => {
    if (propWeather) {
      setWeather(propWeather);
    } else {
      setWeather(getMockWeather());
    }
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
    location: '北京',
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
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (wardrobe.tops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <span className="text-5xl">👕</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">衣柜还是空的</h3>
        <p className="text-white/70 text-center max-w-xs mb-6">
          先去「我的」页面录入你的衣服，我就能为你推荐穿搭了
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Weather Hero - Apple Weather Style */}
      {weather && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Cloud className="w-6 h-6 text-white/80" />
            <span className="text-white/80 text-lg">{preferences?.location || '北京'}</span>
          </div>
          
          <div className="text-[96px] font-light text-white leading-none tracking-tight text-shadow">
            {weather.temp}°
          </div>
          
          <div className="text-white/90 text-xl font-medium mt-2">
            {weather.description}
          </div>
          
          <div className="text-white/70 text-base mt-1">
            体感 {weather.feelsLike}°
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            <WeatherDetail icon={<Droplets size={18} />} label="湿度" value={`${weather.humidity}%`} />
            <WeatherDetail icon={<Wind size={18} />} label="风速" value={`${Math.round(weather.windSpeed)}m/s`} />
            <WeatherDetail 
              icon={weather.isRaining ? <Umbrella size={18} /> : <Sun size={18} />} 
              label={weather.isRaining ? '降雨' : '紫外线'} 
              value={weather.isRaining ? '有雨' : '中等'} 
            />
          </div>
        </div>
      )}

      {/* Scene Selector */}
      <div className="glass-card p-1.5 flex gap-1">
        <SceneBadge 
          active={scene === 'commute'} 
          onClick={() => setScene('commute')}
          icon="🚶"
          label="通勤"
        />
        <SceneBadge 
          active={scene === 'running'} 
          onClick={() => setScene('running')}
          icon="🏃"
          label="跑步"
        />
      </div>

      {/* Outfit Recommendation */}
      {recommendation && (
        <div className="space-y-4">
          {/* Reasoning Card */}
          <div className="glass-card p-4">
            <p className="text-white/90 text-sm leading-relaxed">
              {recommendation.reasoning}
            </p>
          </div>

          {/* Outfit Grid - 2x2 on mobile, 4x1 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ClothingCard item={recommendation.outfit.top} label="上衣" onReplace={() => handleReplace('top')} />
            <ClothingCard item={recommendation.outfit.bottom} label="下装" onReplace={() => handleReplace('bottom')} />
            <ClothingCard item={recommendation.outfit.socks} label="袜子" onReplace={() => handleReplace('socks')} />
            <ClothingCard item={recommendation.outfit.shoes} label="鞋子" onReplace={() => handleReplace('shoes')} />
          </div>

          {/* Refresh Button */}
          <button
            onClick={generateNewRecommendation}
            className="w-full py-4 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-2xl text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-xl"
          >
            <RefreshCw size={18} />
            重新推荐
          </button>
        </div>
      )}

      {/* Alternatives Modal */}
      {showAlternatives && replacingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-[#1c1c1e] rounded-3xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">选择其他{getCategoryLabel(replacingItem)}</h3>
              <button
                onClick={() => setShowAlternatives(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {recommendation?.alternatives?.[replacingItem]?.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectAlternative(item)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-white/5 rounded-2xl transition-colors text-left"
                >
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-3xl">
                    {getCategoryEmoji(item.category)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-white/50 text-sm">
                      {'🔥'.repeat(Math.max(1, Math.min(5, Math.ceil(item.warmthLevel / 2))))}
                      {item.waterResistant && ' 💧'}
                      {item.windResistant && ' 🌬️'}
                    </div>
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

function WeatherDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card p-3 flex flex-col items-center gap-1">
      <div className="text-white/60">{icon}</div>
      <div className="text-white/50 text-xs">{label}</div>
      <div className="text-white font-medium text-sm">{value}</div>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = { top: '上衣', bottom: '下装', socks: '袜子', shoes: '鞋子' };
  return labels[category] || category;
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = { top: '👕', bottom: '👖', socks: '🧦', shoes: '👟' };
  return emojis[category] || '👔';
}
