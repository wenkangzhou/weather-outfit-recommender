'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, RefreshCw, ChevronDown, Wind, Droplets, Plus, Shirt, ArrowRight } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences, RunType } from '@/types';
import { getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ClothingCard from './ClothingCard';
import CityPicker from './CityPicker';

interface OutfitTabProps {
  weather?: WeatherData | null;
}

const RUN_TYPES: { type: RunType; label: string; shortLabel: string; desc: string }[] = [
  { type: 'easy', label: '有氧跑', shortLabel: '有氧', desc: '心率低、出汗少，可适当保暖' },
  { type: 'long', label: '长距离', shortLabel: 'LSD', desc: '需携带补给，选有口袋的裤子' },
  { type: 'interval', label: '间歇跑', shortLabel: '间歇', desc: '速度快产热多，跑后注意保暖' },
];

// 检查衣柜是否完整
function checkWardrobeCompleteness(items: ClothingItem[]) {
  const hasTop = items.some(i => i.category === 'top');
  const hasBottom = items.some(i => i.category === 'bottom');
  const hasSocks = items.some(i => i.category === 'socks');
  const hasShoes = items.some(i => i.category === 'shoes');
  
  const total = items.length;
  const isEmpty = total === 0;
  const isComplete = hasTop && hasBottom && hasSocks && hasShoes;
  const missingCategories = [
    !hasTop && '上衣',
    !hasBottom && '下装',
    !hasSocks && '袜子',
    !hasShoes && '鞋子',
  ].filter(Boolean) as string[];
  
  return { isEmpty, isComplete, hasTop, hasBottom, hasSocks, hasShoes, missingCategories, total };
}

export default function OutfitTab({ weather: propWeather }: OutfitTabProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [scene, setScene] = useState<OutfitScene>('commute');
  const [runType, setRunType] = useState<RunType>('easy');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [wardrobe, setWardrobe] = useState<{
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    socks: ClothingItem[];
    shoes: ClothingItem[];
  }>({ tops: [], bottoms: [], socks: [], shoes: [] });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
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
      if (prefs?.defaultRunType) {
        setRunType(prefs.defaultRunType);
      }
      
      const items = await getClothingItems();
      setAllItems(items);
      
      const wardrobeData = {
        tops: items.filter(i => i.category === 'top'),
        bottoms: items.filter(i => i.category === 'bottom'),
        socks: items.filter(i => i.category === 'socks'),
        shoes: items.filter(i => i.category === 'shoes'),
      };
      setWardrobe(wardrobeData);
      
      // 只有衣柜完整才生成推荐
      const completeness = checkWardrobeCompleteness(items);
      if (completeness.isComplete) {
        const rec = generateRecommendation(
          wardrobeData,
          weather,
          prefs || getDefaultPreferences(),
          scene,
          runType
        );
        setRecommendation(rec);
      } else {
        setRecommendation(null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [weather, scene, runType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDefaultPreferences = (): UserPreferences => ({
    id: 'default',
    location: '上海',
    defaultRunType: 'easy',
  });

  const generateNewRecommendation = useCallback(() => {
    if (!weather || !checkWardrobeCompleteness(allItems).isComplete) return;
    const rec = generateRecommendation(wardrobe, weather, preferences || getDefaultPreferences(), scene, runType);
    setRecommendation(rec);
  }, [weather, wardrobe, preferences, scene, runType, allItems]);

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

  const wardrobeStatus = checkWardrobeCompleteness(allItems);

  // 生成天气提示
  const getWeatherTips = (): string[] => {
    if (!weather) return [];
    const tips: string[] = [];
    
    if (weather.windSpeed > 8) {
      tips.push('风较大，注意防风');
    }
    if (weather.humidity > 75) {
      tips.push('湿度高，体感偏闷热');
    } else if (weather.humidity < 30) {
      tips.push('空气干燥，注意补水');
    }
    if (weather.isRaining) {
      if (weather.rainLevel === 'light') {
        tips.push('下小雨，路面可能湿滑');
      } else if (weather.rainLevel === 'moderate') {
        tips.push('下中雨，建议室内或延期');
      } else if (weather.rainLevel === 'heavy') {
        tips.push('下大雨，不建议户外跑步');
      }
    }
    
    return tips;
  };

  const weatherTips = getWeatherTips();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen pb-24">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // ===== 衣柜为空状态 =====
  if (wardrobeStatus.isEmpty) {
    return (
      <div className="min-h-screen pb-28 animate-fade-in">
        {/* Header */}
        <header className="pt-12 px-5 flex items-center justify-between">
          <button 
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors"
          >
            <MapPin size={16} />
            <span className="font-medium">
              {weather?.cityName || preferences?.location || t('status.locating')}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </header>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
          <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center text-5xl mb-6">
            👕
          </div>
          <h3 className="text-xl font-semibold mb-2">衣柜还是空的</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
            请先录入你的衣物，我才能为你推荐今日穿搭
          </p>
          <Button 
            size="lg" 
            className="h-14 px-8 text-base"
            onClick={() => router.push('/wardrobe')}
          >
            <Plus size={20} className="mr-2" />
            去录入衣物
          </Button>
        </div>

        {/* Location Picker */}
        {showLocationPicker && (
          <CityPicker
            currentCity={weather?.cityName || preferences?.location || '上海'}
            onSelect={(city) => {
              const newWeather = { ...weather!, cityName: city };
              setWeather(newWeather);
            }}
            onClose={() => setShowLocationPicker(false)}
          />
        )}
      </div>
    );
  }

  // ===== 衣柜不完整状态 =====
  if (!wardrobeStatus.isComplete) {
    return (
      <div className="min-h-screen pb-28 animate-fade-in">
        {/* Header */}
        <header className="pt-12 px-5 flex items-center justify-between">
          <button 
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors"
          >
            <MapPin size={16} />
            <span className="font-medium">
              {weather?.cityName || preferences?.location || t('status.locating')}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {/* Scene Toggle */}
          <div className="flex bg-muted rounded-full p-1">
            <SceneButton 
              active={scene === 'commute'} 
              onClick={() => setScene('commute')}
              label={t('scene.commute')}
            />
            <SceneButton 
              active={scene === 'running'} 
              onClick={() => setScene('running')}
              label={t('scene.running')}
            />
          </div>
        </header>

        {/* Weather Summary */}
        {weather && (
          <section className="pt-6 pb-4 px-5">
            <div className="data-large text-foreground">{weather.temp}°</div>
            <div className="text-muted-foreground">{weather.description} · 体感 {weather.feelsLike}°</div>
          </section>
        )}

        {/* Incomplete Wardrobe Notice */}
        <div className="px-5">
          <Card className="p-6 border-dashed border-2">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Shirt size={24} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">衣柜还不完整</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  缺少: {wardrobeStatus.missingCategories.join('、')}
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push('/wardrobe')}
                >
                  <Plus size={16} className="mr-2" />
                  去补充衣物
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Location Picker */}
        {showLocationPicker && (
          <CityPicker
            currentCity={weather?.cityName || preferences?.location || '上海'}
            onSelect={(city) => {
              const newWeather = { ...weather!, cityName: city };
              setWeather(newWeather);
            }}
            onClose={() => setShowLocationPicker(false)}
          />
        )}
      </div>
    );
  }

  // ===== 正常状态：显示穿搭推荐 =====
  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      {/* Compact Header */}
      <header className="pt-12 px-5 flex items-center justify-between">
        <button 
          onClick={() => setShowLocationPicker(true)}
          className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors"
        >
          <MapPin size={16} />
          <span className="font-medium">
            {weather?.cityName || preferences?.location || t('status.locating')}
          </span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        {/* Scene Toggle */}
        <div className="flex bg-muted rounded-full p-1">
          <SceneButton 
            active={scene === 'commute'} 
            onClick={() => setScene('commute')}
            label={t('scene.commute')}
          />
          <SceneButton 
            active={scene === 'running'} 
            onClick={() => setScene('running')}
            label={t('scene.running')}
          />
        </div>
      </header>

      {/* Main Outfit Display - Core Area */}
      <section className="pt-4 px-5">
        {/* Temperature & Weather Info */}
        {weather && (
          <div className="flex items-center justify-between mb-6">
            {/* Left: Temperature */}
            <div>
              <div className="data-large text-foreground">{weather.temp}°</div>
              <div className="text-muted-foreground">{weather.description}</div>
            </div>
            
            {/* Right: Weather Metrics */}
            <div className="flex flex-col items-end gap-2">
              <WeatherMetric icon={<Wind size={14} />} value={`${Math.round(weather.windSpeed)}m/s`} />
              <WeatherMetric icon={<Droplets size={14} />} value={`${weather.humidity}%`} />
            </div>
          </div>
        )}

        {/* Run Type Selector (only for running) */}
        {scene === 'running' && (
          <div className="mb-6">
            <div className="flex gap-2">
              {RUN_TYPES.map((run) => (
                <button
                  key={run.type}
                  onClick={() => setRunType(run.type)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    runType === run.type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {run.label}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {RUN_TYPES.find(r => r.type === runType)?.desc}
            </div>
          </div>
        )}

        {/* Outfit Recommendation - Main Content */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ClothingCard item={recommendation?.outfit.top} label={t('clothing.top')} onReplace={() => handleReplace('top')} />
            <ClothingCard item={recommendation?.outfit.bottom} label={t('clothing.bottom')} onReplace={() => handleReplace('bottom')} />
            <ClothingCard item={recommendation?.outfit.socks} label={t('clothing.socks')} onReplace={() => handleReplace('socks')} />
            <ClothingCard item={recommendation?.outfit.shoes} label={t('clothing.shoes')} onReplace={() => handleReplace('shoes')} />
          </div>

          {/* Reasoning */}
          {recommendation && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <p className="text-sm text-foreground/80">{recommendation.reasoning}</p>
            </Card>
          )}

          {/* Refresh Button */}
          <Button
            onClick={generateNewRecommendation}
            variant="secondary"
            className="w-full h-12"
          >
            <RefreshCw size={16} className="mr-2" />
            {t('outfit.refresh')}
          </Button>
        </div>
      </section>

      {/* Weather Tips */}
      {weatherTips.length > 0 && (
        <section className="px-5 mt-4">
          <div className="space-y-2">
            {weatherTips.map((tip, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <CityPicker
          currentCity={weather?.cityName || preferences?.location || '上海'}
          onSelect={(city) => {
            const newWeather = { ...weather!, cityName: city };
            setWeather(newWeather);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* Alternatives Modal */}
      {showAlternatives && replacingItem && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-end justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md max-h-[60vh] overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">{t('outfit.select')} {t(`clothing.${replacingItem}`)}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAlternatives(false)}>
                <XIcon />
              </Button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[40vh] space-y-2">
              {recommendation?.alternatives?.[replacingItem]?.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectAlternative(item)}
                  className="w-full p-3 flex items-center gap-4 hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <span className="text-2xl">
                    {item.category === 'top' ? '👕' : item.category === 'bottom' ? '👖' : item.category === 'socks' ? '🧦' : '👟'}
                  </span>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ===== Helper Components =====

function WeatherMetric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>{icon}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function SceneButton({ active, onClick, label }: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active 
          ? 'bg-background text-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
