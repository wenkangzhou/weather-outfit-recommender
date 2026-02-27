'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, RefreshCw, ChevronUp } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences } from '@/types';
import { getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      {/* Weather Section */}
      <section className="pt-12 pb-6 px-5">
        {/* Location */}
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground text-sm font-medium">
            {weather?.cityName || preferences?.location || t('status.locating')}
          </span>
        </div>

        {/* Temperature */}
        {weather && (
          <div className="mb-6">
            <div className="data-large text-foreground">
              {weather.temp}°
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-lg text-foreground/80">{weather.description}</div>
                <div className="text-sm text-muted-foreground">
                  {t('weather.tempHigh')} {weather.temp + 3}° · {t('weather.tempLow')} {weather.temp - 5}°
                </div>
              </div>
              <div className="text-5xl">
                {weather.isRaining ? '🌧️' : weather.weatherCode >= 801 ? '☁️' : '☀️'}
              </div>
            </div>
          </div>
        )}

        {/* Weather Details Toggle */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{showDetails ? '收起' : '天气详情'}</span>
          <ChevronUp size={14} className={`transition-transform ${showDetails ? '' : 'rotate-180'}`} />
        </button>

        {showDetails && weather && (
          <Card className="mt-4 p-4 grid grid-cols-3 gap-4 animate-fade-in border-border/50">
            <WeatherDetail icon="💧" label={t('weather.humidity')} value={`${weather.humidity}%`} />
            <WeatherDetail icon="💨" label={t('weather.windSpeed')} value={`${Math.round(weather.windSpeed)}m/s`} />
            <WeatherDetail icon="🌡️" label={t('weather.feelsLike')} value={`${weather.feelsLike}°`} />
          </Card>
        )}
      </section>

      {/* 3D Scene Placeholder */}
      <section className="px-5 mb-6">
        <Card className="h-56 flex flex-col items-center justify-center relative overflow-hidden border-border/50 bg-gradient-to-b from-muted/50 to-muted">
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
          
          {/* Scene Toggle */}
          <div className="absolute top-4 right-4 flex gap-2">
            <SceneBadge 
              active={scene === 'commute'} 
              onClick={() => setScene('commute')}
              icon={<Navigation size={14} />}
              label={t('scene.commute')}
            />
            <SceneBadge 
              active={scene === 'running'} 
              onClick={() => setScene('running')}
              label={t('scene.running')}
            />
          </div>
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

      {/* Alternatives Modal */}
      {showAlternatives && replacingItem && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-end justify-center p-4 animate-fade-in">
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

function WeatherDetail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

function SceneBadge({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-background/80 text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      <span>{label}</span>
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
