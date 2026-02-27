'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, RefreshCw, ChevronDown, Wind, Droplets, CloudRain } from 'lucide-react';
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

export default function OutfitTab({ weather: propWeather }: OutfitTabProps) {
  const { t } = useTranslation();
  const [scene, setScene] = useState<OutfitScene>('commute');
  const [runType, setRunType] = useState<RunType>('easy');
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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
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
      if (prefs?.defaultRunType) {
        setRunType(prefs.defaultRunType);
      }
      
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
          scene,
          runType
        );
        setRecommendation(rec);
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
    if (!weather || wardrobe.tops.length === 0) return;
    const rec = generateRecommendation(wardrobe, weather, preferences || getDefaultPreferences(), scene, runType);
    setRecommendation(rec);
  }, [weather, wardrobe, preferences, scene, runType]);

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

  if (wardrobe.tops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl mb-4">
          👕
        </div>
        <h3 className="text-lg font-medium mb-2">{t('outfit.emptyWardrobe')}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('outfit.emptyWardrobeDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      {/* Header - Location & Scene Toggle */}
      <header className="pt-12 px-5 flex items-center justify-between">
        {/* Location Picker */}
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

      {/* Weather Section */}
      <section className="pt-6 pb-6 px-5">
        {/* Temperature */}
        {weather && (
          <div className="mb-6">
            <div className="data-large text-foreground">
              {weather.temp}°
            </div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <div className="text-lg text-foreground/80">{weather.description}</div>
                <div className="text-sm text-muted-foreground">
                  体感 {weather.feelsLike}° · {t('weather.tempHigh')} {weather.temp + 3}°
                </div>
              </div>
              <div className="text-5xl">
                {weather.isRaining ? '🌧️' : weather.weatherCode >= 801 ? '☁️' : '☀️'}
              </div>
            </div>
          </div>
        )}

        {/* Weather Details */}
        <div className="flex gap-3">
          <WeatherBadge icon={<Wind size={14} />} value={`${Math.round(weather?.windSpeed || 0)}m/s`} label="风速" />
          <WeatherBadge icon={<Droplets size={14} />} value={`${weather?.humidity || 0}%`} label="湿度" />
        </div>

        {/* Weather Tips */}
        {weatherTips.length > 0 && (
          <div className="mt-4 space-y-2">
            {weatherTips.map((tip, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {tip}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Run Type Selector - Only for Running Scene */}
      {scene === 'running' && (
        <section className="px-5 mb-6">
          <div className="label-uppercase mb-3">课表类型</div>
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
          
          {/* Run Type Description */}
          <div className="mt-3 text-sm text-muted-foreground">
            {RUN_TYPES.find(r => r.type === runType)?.desc}
          </div>
        </section>
      )}

      {/* 3D Scene Placeholder */}
      <section className="px-5 mb-6">
        <Card className="h-52 flex flex-col items-center justify-center relative overflow-hidden border-border/50 bg-gradient-to-b from-muted/50 to-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-2xl bg-background/50 border border-border flex items-center justify-center text-5xl">
              👔
            </div>
          </div>
          
          {recommendation && (
            <div className="absolute bottom-4 left-4 right-4 surface-glass p-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {recommendation.reasoning}
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Outfit Section */}
      <section className="px-5 space-y-4">
        <div className="label-uppercase">{t('outfit.todayOutfit')}</div>
        
        {recommendation && (
          <div className="grid grid-cols-2 gap-3">
            <ClothingCard item={recommendation.outfit.top} label={t('clothing.top')} onReplace={() => handleReplace('top')} />
            <ClothingCard item={recommendation.outfit.bottom} label={t('clothing.bottom')} onReplace={() => handleReplace('bottom')} />
            <ClothingCard item={recommendation.outfit.socks} label={t('clothing.socks')} onReplace={() => handleReplace('socks')} />
            <ClothingCard item={recommendation.outfit.shoes} label={t('clothing.shoes')} onReplace={() => handleReplace('shoes')} />
          </div>
        )}

        <Button
          onClick={generateNewRecommendation}
          variant="secondary"
          className="w-full h-12"
        >
          <RefreshCw size={16} className="mr-2" />
          {t('outfit.refresh')}
        </Button>
      </section>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <CityPicker
          currentCity={weather?.cityName || preferences?.location || '上海'}
          onSelect={(city) => {
            // Update weather with new city
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

function WeatherBadge({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
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
