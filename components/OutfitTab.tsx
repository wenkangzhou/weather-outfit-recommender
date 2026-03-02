'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MapPin, RefreshCw, ChevronDown, Wind, Droplets, Plus, Shirt, Check, History, X } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences, RunType } from '@/types';
import { getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences, saveOutfitToHistory } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClothingCard from './ClothingCard';
import CityPicker from './CityPicker';
import { toast } from '@/hooks/use-toast';

interface OutfitTabProps {
  weather?: WeatherData | null;
}

const RUN_TYPES: { type: RunType; label: string; shortLabel: string; desc: string }[] = [
  { type: 'easy', label: '有氧跑', shortLabel: '有氧', desc: '心率低、出汗少，可适当保暖' },
  { type: 'long', label: '长距离', shortLabel: 'LSD', desc: '需携带补给，选有口袋的裤子' },
  { type: 'interval', label: '间歇跑', shortLabel: '间歇', desc: '速度快产热多，跑后注意保暖' },
];

// 检查衣柜是否完整（帽子可选）
function checkWardrobeCompleteness(items: ClothingItem[]) {
  const hasTop = items.some(i => i.category === 'top');
  const hasBottom = items.some(i => i.category === 'bottom');
  const hasSocks = items.some(i => i.category === 'socks');
  const hasShoes = items.some(i => i.category === 'shoes');
  const hasHat = items.some(i => i.category === 'hat');
  
  const total = items.length;
  const isEmpty = total === 0;
  const isComplete = hasTop && hasBottom && hasSocks && hasShoes;
  const missingCategories = [
    !hasTop && '上衣',
    !hasBottom && '下装',
    !hasSocks && '袜子',
    !hasShoes && '鞋子',
  ].filter(Boolean) as string[];
  
  return { isEmpty, isComplete, hasTop, hasBottom, hasSocks, hasShoes, hasHat, missingCategories, total };
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
    hats: ClothingItem[];
  }>({ tops: [], bottoms: [], socks: [], shoes: [], hats: [] });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showHatSelector, setShowHatSelector] = useState(false);
  const [replacingItem, setReplacingItem] = useState<'top' | 'bottom' | 'socks' | 'shoes' | 'hat' | null>(null);
  const [saving, setSaving] = useState(false);
  
  // 手动选择的多层上衣（用户自定义搭配）
  const [manualTopLayers, setManualTopLayers] = useState<ClothingItem[] | null>(null);
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  
  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; index: number } | null>(null);
  
  // 悬浮操作菜单状态
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // 用户是否手动切换过跑步类型
  const [runTypeChangedByUser, setRunTypeChangedByUser] = useState(false);

  useEffect(() => {
    // 只有当 propWeather 有值时才设置，否则保持 null（显示 loading）
    if (propWeather) {
      setWeather(propWeather);
    }
  }, [propWeather]);

  const loadData = useCallback(async (showLoading = false) => {
    if (!weather) return;
    
    try {
      // 只有明确需要时才显示 loading，避免 tab 切换时闪烁
      if (showLoading) {
        setLoading(true);
      }
      const prefs = await getUserPreferences();
      setPreferences(prefs);
      // 只在初始化时设置默认跑步类型，不覆盖用户手动选择
      if (prefs?.defaultRunType && !runTypeChangedByUser) {
        setRunType(prefs.defaultRunType);
      }
      
      const items = await getClothingItems();
      setAllItems(items);
      
      const wardrobeData = {
        tops: items.filter(i => i.category === 'top'),
        bottoms: items.filter(i => i.category === 'bottom'),
        socks: items.filter(i => i.category === 'socks'),
        shoes: items.filter(i => i.category === 'shoes'),
        hats: items.filter(i => i.category === 'hat'),
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
    // tab 切换时：如果已有数据，不显示 loading；如果是首次加载，显示 loading
    const isFirstLoad = !wardrobe.tops.length && !allItems.length;
    loadData(isFirstLoad);
  }, [loadData]);

  // 监听跑步类型变化，自动重新生成推荐
  useEffect(() => {
    if (scene === 'running' && weather && wardrobe.tops.length > 0) {
      generateNewRecommendation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runType]);

  const getDefaultPreferences = (): UserPreferences => ({
    id: 'default',
    location: '上海',
    defaultRunType: 'easy',
  });

  const generateNewRecommendation = useCallback(() => {
    if (!weather) return;
    // 检查 wardrobe 是否有数据
    const hasWardrobe = wardrobe.tops.length > 0 && wardrobe.bottoms.length > 0 && wardrobe.socks.length > 0 && wardrobe.shoes.length > 0;
    if (!hasWardrobe) {
      toast({ title: '请先添加衣物', description: '需要至少一件上衣、下装、袜子和鞋子' });
      return;
    }
    
    // 排除当前推荐的物品，实现"换一批"
    const excludeItems = recommendation ? {
      topId: recommendation.outfit.top?.id,
      bottomId: recommendation.outfit.bottom?.id,
      socksId: recommendation.outfit.socks?.id,
      shoesId: recommendation.outfit.shoes?.id,
    } : undefined;
    
    const rec = generateRecommendation(
      wardrobe, 
      weather, 
      preferences || getDefaultPreferences(), 
      scene, 
      runType,
      excludeItems
    );
    setRecommendation(rec);
  }, [weather, wardrobe, preferences, scene, runType, recommendation]);

  const handleReplace = (category: 'top' | 'bottom' | 'socks' | 'shoes' | 'hat') => {
    setReplacingItem(category);
    setShowAlternatives(true);
  };

  // 添加一层上衣
  const handleAddLayer = () => {
    setShowAddLayerModal(true);
  };

  // 点击删除按钮 - 打开确认对话框
  const handleRemoveLayer = (index: number) => {
    setDeleteConfirm({ show: true, index });
  };
  
  // 确认删除
  const confirmRemoveLayer = () => {
    if (!deleteConfirm) return;
    const index = deleteConfirm.index;
    
    // 获取当前所有层（包括手动添加或算法推荐的）
    const currentLayers = manualTopLayers || recommendation?.layeredTops || [recommendation?.outfit.top].filter(Boolean) as ClothingItem[];
    const newLayers = currentLayers.filter((_, i) => i !== index);
    setManualTopLayers(newLayers);
    
    // 更新推荐结果
    if (recommendation) {
      if (newLayers.length === 0) {
        // 如果全部删除了，保持空（不应该发生，至少保留一件）
        setRecommendation({
          ...recommendation,
          outfit: { ...recommendation.outfit },
          layeredTops: undefined,
        });
      } else {
        // 更新多层
        setRecommendation({
          ...recommendation,
          outfit: { 
            ...recommendation.outfit, 
            top: newLayers[newLayers.length - 1] // 最外层作为主显示
          },
          layeredTops: newLayers.length > 1 ? newLayers : undefined,
        });
      }
    }
    setDeleteConfirm(null);
  };

  // 选择添加为新层
  const selectAsNewLayer = (item: ClothingItem) => {
    const currentLayers = manualTopLayers || [recommendation?.outfit.top].filter(Boolean) as ClothingItem[];
    const newLayers = [...currentLayers, item];
    setManualTopLayers(newLayers);
    
    if (recommendation) {
      setRecommendation({
        ...recommendation,
        outfit: { 
          ...recommendation.outfit, 
          top: item // 新添加的作为最外层
        },
        layeredTops: newLayers,
      });
    }
    setShowAddLayerModal(false);
  };

  const handleAddHat = () => {
    setShowHatSelector(true);
  };

  const selectHat = (hat: ClothingItem) => {
    if (!recommendation) return;
    setRecommendation({
      ...recommendation,
      outfit: { ...recommendation.outfit, hat },
    });
    setShowHatSelector(false);
  };

  const removeHat = () => {
    if (!recommendation) return;
    const { hat, ...rest } = recommendation.outfit;
    setRecommendation({
      ...recommendation,
      outfit: rest as any,
    });
  };

  const selectAlternative = (item: ClothingItem) => {
    if (!recommendation || !replacingItem) return;
    
    if (replacingItem === 'top') {
      // 更换上衣时，同步更新 layeredTops
      const currentLayers = recommendation.layeredTops || [recommendation.outfit.top];
      // 替换最外层（最后一层）
      const newLayers = [...currentLayers];
      newLayers[newLayers.length - 1] = item;
      
      setRecommendation({
        ...recommendation,
        outfit: { ...recommendation.outfit, top: item },
        layeredTops: newLayers,
      });
      setManualTopLayers(newLayers);
    } else {
      setRecommendation({
        ...recommendation,
        outfit: { ...recommendation.outfit, [replacingItem]: item },
      });
    }
    setShowAlternatives(false);
    setReplacingItem(null);
  };

  // 保存穿搭
  const handleSaveOutfit = async () => {
    if (!recommendation || !weather) return;
    
    try {
      setSaving(true);
      
      // 构建保存的数据，包含多层上衣
      // 优先使用 manualTopLayers（用户手动调整的），否则使用 recommendation.layeredTops（算法推荐的）
      const currentLayers = manualTopLayers !== null 
        ? manualTopLayers 
        : (recommendation.layeredTops || [recommendation.outfit.top]);
      
      // 如果只剩一层，更新 top 为该层；如果有多层，保存 layeredTops
      const itemsToSave = {
        ...recommendation.outfit,
        top: currentLayers[currentLayers.length - 1] || recommendation.outfit.top,
        layeredTops: currentLayers.length > 1 ? currentLayers : undefined,
      };
      
      const result = await saveOutfitToHistory({
        items: itemsToSave,
        weatherData: weather,
        locationName: weather.cityName || preferences?.location || '未知位置',
        scene,
        runType: scene === 'running' ? runType : undefined,
      });
      
      // 显示成功提示
      toast({ title: '穿搭已保存' });
    } catch (error) {
      console.error('Failed to save outfit:', error);
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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

  // 检查物品是否适合当前场景
  const isItemSuitableForScene = (item: ClothingItem) => {
    if (scene === 'commute') {
      return item.usage === 'commute' || item.usage === 'both';
    }
    if (scene === 'running') {
      return item.usage === 'running' || item.usage === 'both';
    }
    return true;
  };

  // 获取可更换的备选列表（已按场景过滤，并排除已选项）
  const getAlternativeItems = () => {
    if (!replacingItem) return [];
    let items: ClothingItem[] = [];
    switch (replacingItem) {
      case 'top': 
        items = wardrobe.tops; 
        // 过滤掉已在 layeredTops 中的上衣
        const currentTopIds = new Set(
          (recommendation?.layeredTops || [recommendation?.outfit.top])
            .filter(Boolean)
            .map(t => t!.id)
        );
        return items.filter(item => 
          isItemSuitableForScene(item) && !currentTopIds.has(item.id)
        );
      case 'bottom': items = wardrobe.bottoms; break;
      case 'socks': items = wardrobe.socks; break;
      case 'shoes': items = wardrobe.shoes; break;
      case 'hat': items = wardrobe.hats; break;
    }
    // 按场景过滤
    return items.filter(isItemSuitableForScene);
  };

  // 获取当前选中的物品
  const getCurrentItem = () => {
    if (!replacingItem || !recommendation) return null;
    return recommendation.outfit[replacingItem];
  };

  if (loading || !weather) {
    return (
      <div className="flex items-center justify-center h-screen pb-24">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ===== 衣柜为空状态 =====
  if (wardrobeStatus.isEmpty) {
    return (
      <div className="min-h-screen pb-16 animate-fade-in">
        {/* Header */}
        <header className="safe-area-header px-5 flex items-center justify-between">
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
      <div className="min-h-screen pb-16 animate-fade-in">
        {/* Header */}
        <header className="safe-area-header px-5 flex items-center justify-between">
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
        <section className="pt-6 pb-4 px-5">
          <div className="flex items-center justify-between">
            {/* Left: Temperature & Weather Icon */}
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {weather?.isRaining ? '🌧️' : 
                 weather?.weatherCode && weather.weatherCode >= 801 ? '☁️' : 
                 weather?.weatherCode && weather.weatherCode >= 800 ? '☀️' : '⛅'}
              </div>
              <div>
                <div className="data-large text-foreground leading-none">{weather?.temp ?? 15}°</div>
                <div className="text-muted-foreground text-sm mt-1">
                  {weather?.description ?? '多云'} · 体感 {weather?.feelsLike ?? 13}°
                </div>
              </div>
            </div>
            
            {/* Right: Weather Metrics */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Wind size={14} className="text-blue-500" />
                <span className="font-medium tabular-nums text-foreground">{Math.round(weather?.windSpeed ?? 3)}m/s</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Droplets size={14} className="text-cyan-500" />
                <span className="font-medium tabular-nums text-foreground">{weather?.humidity ?? 65}%</span>
              </div>
            </div>
          </div>
        </section>

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
    <div className="min-h-screen pb-16 animate-fade-in">
      {/* Compact Header */}
      <header className="safe-area-header px-5 flex items-center justify-between">
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
        {/* Temperature & Weather Info - 紧凑布局 */}
        <div className="flex items-center justify-between mb-3">
          {/* Left: Weather Icon & Temp */}
          <div className="flex items-center gap-2.5">
            <div className="text-3xl">
              {weather?.isRaining ? '🌧️' : 
               weather?.weatherCode && weather.weatherCode >= 801 ? '☁️' : 
               weather?.weatherCode && weather.weatherCode >= 800 ? '☀️' : '⛅'}
            </div>
            <div>
              <div className="text-2xl font-light text-foreground leading-none">{weather?.temp ?? 15}°</div>
              <div className="text-muted-foreground text-[11px] mt-0.5">
                体感 {weather?.feelsLike ?? 13}°
              </div>
            </div>
          </div>
          
          {/* Right: Weather Metrics + Tips 紧凑排列 */}
          <div className="flex items-center gap-4">
            {/* Weather Tips */}
            {weatherTips.length > 0 && (
              <div className="flex flex-col items-end gap-0.5">
                {weatherTips.slice(0, 2).map((tip, index) => (
                  <div key={index} className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    <span className="truncate max-w-[100px]">{tip}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Wind & Humidity */}
            <div className="flex flex-col items-end gap-0.5 text-[11px]">
              <div className="flex items-center gap-1">
                <Wind size={11} className="text-blue-500" />
                <span className="font-medium tabular-nums text-foreground">{Math.round(weather?.windSpeed ?? 3)}m/s</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets size={11} className="text-cyan-500" />
                <span className="font-medium tabular-nums text-foreground">{weather?.humidity ?? 65}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning - 推荐理由卡片 */}
        {recommendation && (
          <Card className="mx-0 mb-3 p-3 bg-primary/5 border-primary/20">
            <p className="text-xs text-foreground/80 text-center">{recommendation.reasoning}</p>
          </Card>
        )}

        {/* Run Type Selector (only for running) */}
        {scene === 'running' && (
          <div className="mb-4">
            <div className="flex gap-2">
              {RUN_TYPES.map((run) => (
                <button
                  key={run.type}
                  onClick={() => {
                    setRunType(run.type);
                    setRunTypeChangedByUser(true);
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    runType === run.type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {run.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outfit Recommendation - Main Content */}
        <div className="space-y-3">
          {/* 主要穿搭 - 列表形式，一行一个 */}
          <div className="space-y-2">
            {/* 上衣 - 支持多层显示和编辑 */}
            <div className="space-y-2">
              {/* 多层上衣卡片容器 - 新设计 */}
              <div className={`${(recommendation?.layeredTops?.length || 0) > 1 ? 'bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-3 space-y-2 border border-border/50' : ''}`}>
                {/* 多层标题 */}
                {(recommendation?.layeredTops?.length || 0) > 1 && (
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">上衣搭配</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">{(recommendation?.layeredTops?.length || 1)} 层</span>
                    </div>
                  </div>
                )}
                
                {(recommendation?.layeredTops || [recommendation?.outfit.top]).filter(Boolean).map((layer, index, arr) => {
                  // 确定层级标签
                  let layerLabel: string;
                  let layerBadgeColor: string;
                  if (arr.length === 1) {
                    layerLabel = t('clothing.top');
                    layerBadgeColor = 'bg-primary/10 text-primary';
                  } else if (index === 0) {
                    layerLabel = '内层';
                    layerBadgeColor = 'bg-emerald-100 text-emerald-700';
                  } else if (index === arr.length - 1) {
                    layerLabel = '外层';
                    layerBadgeColor = 'bg-amber-100 text-amber-700';
                  } else {
                    layerLabel = '中层';
                    layerBadgeColor = 'bg-blue-100 text-blue-700';
                  }
                  return (
                    <div key={layer!.id} className="group relative">
                      <ClothingCard 
                        item={layer!} 
                        label={layerLabel}
                        labelBadgeColor={layerBadgeColor}
                        icon={index === arr.length - 1 ? '👕' : '👔'}
                        onReplace={() => handleReplace('top')} 
                      />
                      {/* 多层时显示删除按钮 - 放在卡片右上角，hover时显示 */}
                      {arr.length > 1 && (
                        <button
                          onClick={() => handleRemoveLayer(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-destructive/20"
                          title="删除这层"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* 添加上衣层按钮 */}
              <button
                onClick={handleAddLayer}
                className="w-full py-2 px-4 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center justify-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                添加上衣层
              </button>
            </div>
            <ClothingCard item={recommendation?.outfit.bottom} label={t('clothing.bottom')} icon="👖" onReplace={() => handleReplace('bottom')} />
            <ClothingCard item={recommendation?.outfit.socks} label={t('clothing.socks')} icon="🧦" onReplace={() => handleReplace('socks')} />
            <ClothingCard item={recommendation?.outfit.shoes} label={t('clothing.shoes')} icon="👟" onReplace={() => handleReplace('shoes')} />
            
            {/* 帽子 - 可选 */}
            {wardrobeStatus.hasHat && (
              <>
                {recommendation?.outfit.hat ? (
                  <ClothingCard 
                    item={recommendation.outfit.hat} 
                    label="帽子" 
                    icon="🧢"
                    onReplace={() => handleReplace('hat')} 
                  />
                ) : (
                  <ClothingCard 
                    showAdd 
                    label="帽子" 
                    icon="🧢"
                    onAdd={handleAddHat}
                  />
                )}
              </>
            )}
          </div>
          
          {/* View History Link */}
          <button
            onClick={() => router.push('/history')}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <History size={12} />
            查看历史穿搭
          </button>
        </div>
      </section>



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

      {/* Alternatives Modal - Centered, not bottom */}
      {showAlternatives && replacingItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">{t('outfit.select')} {replacingItem === 'hat' ? '帽子' : t(`clothing.${replacingItem}`)}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAlternatives(false)}>
                <XIcon />
              </Button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[50vh] space-y-2">
              {(() => {
                const alternatives = getAlternativeItems();
                const currentItem = getCurrentItem();
                
                return alternatives.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectAlternative(item)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-muted rounded-xl transition-colors text-left ${
                      currentItem?.id === item.id ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                  >
                    <span className="text-xl">
                      {item.category === 'top' ? '👕' : 
                       item.category === 'bottom' ? '👖' : 
                       item.category === 'socks' ? '🧦' : 
                       item.category === 'hat' ? '🧢' : '👟'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)}</div>
                    </div>
                    {currentItem?.id === item.id && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded shrink-0">当前</span>
                    )}
                  </button>
                ));
              })()}
            </div>
          </Card>
        </div>
      )}

      {/* Hat Selector Modal */}
      {showHatSelector && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">选择帽子</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowHatSelector(false)}>
                <XIcon />
              </Button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[50vh] space-y-2">
              {wardrobe.hats.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectHat(item)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <span className="text-xl">🧢</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Add Layer Modal */}
      {showAddLayerModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">添加上衣层</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddLayerModal(false)}>
                <XIcon />
              </Button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[50vh] space-y-2">
              {wardrobe.tops
                .filter(item => isItemSuitableForScene(item))
                .filter(item => !(recommendation?.layeredTops || [recommendation?.outfit.top]).some(l => l?.id === item.id))
                .map(item => (
                <button
                  key={item.id}
                  onClick={() => selectAsNewLayer(item)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <span className="text-xl">👕</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)} · 保暖{item.warmthLevel}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">添加为外层</span>
                </button>
              ))}
              {wardrobe.tops.filter(item => isItemSuitableForScene(item)).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  没有更多适合的上衣了
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm?.show && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-destructive">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">删除这层穿搭？</h3>
              <p className="text-sm text-muted-foreground mb-6">
                此操作不可撤销，确定要删除吗？
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmRemoveLayer}
                >
                  删除
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Action Button - 右下角悬浮按钮 */}
      <div className="fixed bottom-[120px] right-4 z-40 flex flex-col items-end gap-2">
        {/* 展开的菜单按钮 */}
        {showActionMenu && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-fade-in">
            <button
              onClick={() => {
                generateNewRecommendation();
                setShowActionMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg text-sm font-medium hover:bg-slate-700 transition-all"
            >
              <RefreshCw size={16} />
              重新推荐
            </button>
            <button
              onClick={() => {
                handleSaveOutfit();
                setShowActionMenu(false);
              }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg text-sm font-medium hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              确认穿搭
            </button>
          </div>
        )}
        
        {/* 主悬浮按钮 - 使用魔法棒/闪电图标 */}
        <button
          onClick={() => setShowActionMenu(!showActionMenu)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            showActionMenu 
              ? 'bg-muted rotate-90' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {showActionMenu ? (
            <X size={20} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ===== Helper Components =====

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
