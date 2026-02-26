'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, Droplets, Wind, RefreshCw, Sparkles, ChevronRight, MapPin } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences } from '@/types';
import { getCurrentWeather, getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences } from '@/lib/supabase';
import ClothingCard from './ClothingCard';

export default function OutfitTab() {
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

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load preferences
      const prefs = await getUserPreferences();
      setPreferences(prefs);
      
      // Load wardrobe
      const items = await getClothingItems();
      setWardrobe({
        tops: items.filter(i => i.category === 'top'),
        bottoms: items.filter(i => i.category === 'bottom'),
        socks: items.filter(i => i.category === 'socks'),
        shoes: items.filter(i => i.category === 'shoes'),
      });
      
      // Load weather
      let weatherData: WeatherData;
      if (prefs?.location) {
        try {
          weatherData = await getCurrentWeather(prefs.location);
        } catch {
          weatherData = getMockWeather();
        }
      } else {
        weatherData = getMockWeather();
      }
      setWeather(weatherData);
      
      // Generate initial recommendation if we have data
      if (items.length > 0) {
        const rec = generateRecommendation(
          {
            tops: items.filter(i => i.category === 'top'),
            bottoms: items.filter(i => i.category === 'bottom'),
            socks: items.filter(i => i.category === 'socks'),
            shoes: items.filter(i => i.category === 'shoes'),
          },
          weatherData,
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
  };

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
    
    const rec = generateRecommendation(
      wardrobe,
      weather,
      preferences || getDefaultPreferences(),
      scene
    );
    setRecommendation(rec);
  }, [weather, wardrobe, preferences, scene]);

  useEffect(() => {
    generateNewRecommendation();
  }, [scene, generateNewRecommendation]);

  const handleReplace = (category: 'top' | 'bottom' | 'socks' | 'shoes') => {
    setReplacingItem(category);
    setShowAlternatives(true);
  };

  const selectAlternative = (item: ClothingItem) => {
    if (!recommendation || !replacingItem) return;
    
    setRecommendation({
      ...recommendation,
      outfit: {
        ...recommendation.outfit,
        [replacingItem]: item,
      },
    });
    setShowAlternatives(false);
    setReplacingItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (wardrobe.tops.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">👕</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">还没有录入衣服</h3>
        <p className="text-gray-500 mb-4">先去"我的"页面录入你的衣柜吧</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Weather Card */}
      {weather && (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-100 text-sm">
                <MapPin size={14} />
                {preferences?.location || '北京'}
              </div>
              <div className="text-4xl font-bold mt-1">{weather.temp}°</div>
              <div className="text-blue-100 text-sm">{weather.description}</div>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-blue-200">体感</span>
                <span>{weather.feelsLike}°</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <Droplets size={16} />
                <span className="text-sm">{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <Wind size={16} />
                <span className="text-sm">{weather.windSpeed}m/s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scene Selector */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setScene('commute')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            scene === 'commute'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚶 日常通勤
        </button>
        <button
          onClick={() => setScene('running')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            scene === 'running'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏃 跑步
        </button>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="space-y-4">
          {/* Reasoning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <Sparkles size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">{recommendation.reasoning}</p>
          </div>

          {/* Outfit Grid */}
          <div className="grid grid-cols-2 gap-3">
            <ClothingCard
              item={recommendation.outfit.top}
              label="上衣"
              onReplace={() => handleReplace('top')}
            />
            <ClothingCard
              item={recommendation.outfit.bottom}
              label="下装"
              onReplace={() => handleReplace('bottom')}
            />
            <ClothingCard
              item={recommendation.outfit.socks}
              label="袜子"
              onReplace={() => handleReplace('socks')}
            />
            <ClothingCard
              item={recommendation.outfit.shoes}
              label="鞋子"
              onReplace={() => handleReplace('shoes')}
            />
          </div>

          {/* Actions */}
          <button
            onClick={generateNewRecommendation}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            重新推荐
          </button>
        </div>
      )}

      {/* Alternatives Modal */}
      {showAlternatives && replacingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium">选择其他{getCategoryLabel(replacingItem)}</h3>
              <button
                onClick={() => setShowAlternatives(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {recommendation?.alternatives?.[replacingItem]?.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectAlternative(item)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {getCategoryEmoji(item.category)}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      保暖度: {'🔥'.repeat(item.warmthLevel)}
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

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    top: '上衣',
    bottom: '下装',
    socks: '袜子',
    shoes: '鞋子',
  };
  return labels[category] || category;
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    top: '👕',
    bottom: '👖',
    socks: '🧦',
    shoes: '👟',
  };
  return emojis[category] || '👔';
}
