'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MapPin, RefreshCw, ChevronDown, Wind, Droplets, Plus, Shirt, Check, History, X, Share2 } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences, RunType } from '@/types';
import { getMockWeather } from '@/lib/weather';
import { generateRecommendation } from '@/lib/recommendation';
import { getClothingItems, getUserPreferences, saveUserPreferences, saveOutfitToHistory, addClothingItem, saveOutfitShare } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClothingCard from './ClothingCard';
import CityPicker from './CityPicker';
import { toast } from '@/hooks/use-toast';

interface OutfitTabProps {
  weather?: WeatherData | null;
  isActive?: boolean;
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

export default function OutfitTab({ weather: propWeather, isActive = true }: OutfitTabProps) {
  const router = useRouter();
  
  // 当切换到其他 tab 时，关闭菜单
  useEffect(() => {
    if (!isActive) {
      setShowActionMenu(false);
    }
  }, [isActive]);
  
  // 当 tab 变为活跃时，重新加载偏好设置（确保设置页修改后立即生效）
  useEffect(() => {
    if (isActive && weather) {
      console.log('[OutfitTab] Tab became active, reloading preferences...');
      // 不显示 loading，避免闪烁
      loadData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);
  
  const { t, i18n } = useTranslation();
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
  
  // 处理场景切换并保存（必须在 preferences 声明之后）
  const handleSceneChange = useCallback(async (newScene: OutfitScene) => {
    console.log('[handleSceneChange] Changing scene to:', newScene);
    setScene(newScene);
    if (preferences) {
      const newPrefs = { ...preferences, defaultScene: newScene };
      console.log('[handleSceneChange] Saving preferences:', newPrefs);
      const saved = await saveUserPreferences(newPrefs);
      console.log('[handleSceneChange] Save result:', saved);
      setPreferences(newPrefs);
    } else {
      console.warn('[handleSceneChange] No preferences loaded');
    }
  }, [preferences]);
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
  
  // 推荐组合索引（用于"重新推荐"时轮换不同组合）
  const [combinationIndex, setCombinationIndex] = useState(0);
  
  // 分享相关状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareId, setShareId] = useState<string>('');

  // 客户端挂载状态
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
      console.log('[OutfitTab] Loaded prefs:', prefs);
      setPreferences(prefs);
      // 只在初始化时设置默认跑步类型，不覆盖用户手动选择
      if (prefs?.defaultRunType && !runTypeChangedByUser) {
        setRunType(prefs.defaultRunType);
      }
      // 设置默认推荐场景
      if (prefs?.defaultScene) {
        setScene(prefs.defaultScene);
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
      
      // 总是生成推荐（衣柜不完整时使用虚拟衣物）
      const prefsToUse = prefs || getDefaultPreferences();
      console.log('[OutfitTab] Using prefs for recommendation:', prefsToUse);
      const rec = generateRecommendation(
        wardrobeData,
        weather,
        prefsToUse,
        scene,
        runType
      );
      console.log('[OutfitTab] Generated recommendation targetTemp:', rec.reasoningData?.targetTemp);
      setRecommendation(rec);
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
  
  // 场景或天气变化时重置组合索引
  useEffect(() => {
    setCombinationIndex(0);
  }, [scene, weather?.feelsLike, weather?.weatherCode]);

  const getDefaultPreferences = (): UserPreferences => ({
    id: 'default',
    location: '上海',
    defaultRunType: 'easy',
    commuteTargetTemp: 24,
    easyRunTargetTemp: 12,
    longRunTargetTemp: 10,
    intervalRunTargetTemp: 8,
    defaultScene: 'commute',
  });

  const generateNewRecommendation = useCallback(() => {
    if (!weather) return;
    // 不再检查衣柜是否完整，generateRecommendation 会自动混入虚拟衣物
    
    // 递增组合索引，实现不同层组合的轮换
    const nextIndex = combinationIndex + 1;
    setCombinationIndex(nextIndex);
    
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
      excludeItems,
      nextIndex // 传入组合索引，轮换不同的层组合
    );
    setRecommendation(rec);
  }, [weather, wardrobe, preferences, scene, runType, recommendation, combinationIndex]);

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

  // 添加虚拟衣物到衣柜
  const handleAddVirtualToWardrobe = async (item: ClothingItem) => {
    try {
      // 创建新物品（去掉 isVirtual，数据库不支持该列）
      const newItem = {
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        warmthLevel: item.warmthLevel,
        waterResistant: item.waterResistant,
        windResistant: item.windResistant,
        usage: item.usage,
        hasPockets: item.hasPockets,
      };
      
      // 添加并获取新物品（包含生成的ID）
      const addedItem = await addClothingItem(newItem);
      
      // 把新物品ID保存到 localStorage（标记为平台推荐）
      const saved = localStorage.getItem('virtualItemIds');
      const virtualIds = new Set(saved ? JSON.parse(saved) : []);
      virtualIds.add(addedItem.id);
      localStorage.setItem('virtualItemIds', JSON.stringify(Array.from(virtualIds)));
      
      // 刷新衣柜数据
      const items = await getClothingItems();
      setAllItems(items);
      const newWardrobe = {
        tops: items.filter(i => i.category === 'top'),
        bottoms: items.filter(i => i.category === 'bottom'),
        socks: items.filter(i => i.category === 'socks'),
        shoes: items.filter(i => i.category === 'shoes'),
        hats: items.filter(i => i.category === 'hat'),
      };
      setWardrobe(newWardrobe);
      
      // 重新生成推荐（让用户衣物优先被选中）
      if (weather) {
        const rec = generateRecommendation(
          newWardrobe,
          weather,
          preferences || getDefaultPreferences(),
          scene,
          runType
        );
        setRecommendation(rec);
      }
      
      // 通知其他组件衣柜已更新
      window.dispatchEvent(new Event('wardrobe-changed'));
      
      toast({ 
        title: t('virtual.addedToWardrobe'),
        description: t('wardrobe.editSuggestion') || '建议去「衣柜」修改为真实衣物名称',
      });
    } catch (error) {
      console.error('Failed to add item:', error);
      toast({
        title: '添加失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const wardrobeStatus = checkWardrobeCompleteness(allItems);
  
  // 分享穿搭
  const handleShare = async () => {
    if (!recommendation || !weather) return;
    
    setShowActionMenu(false);
    setShowShareModal(true);
    
    try {
      // 保存到数据库获取真实 ID
      const shareData = {
        outfit: recommendation,
        weather,
        location: weather.cityName || preferences?.location || (i18n.language === 'zh' ? '未知位置' : 'Unknown'),
        createdAt: new Date().toISOString(),
      };
      
      const saved = await saveOutfitShare(shareData);
      setShareId(saved.id);
      
      // 复制链接到剪贴板
      const shareUrl = `${window.location.origin}/share/${saved.id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({ 
        title: t('share.linkCopied'),
        description: t('share.linkPasteHint')
      });
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: '分享失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 组装推荐理由（支持 i18n）- 使用 useMemo 缓存
  const formattedReasoning = useMemo(() => {
    if (!recommendation?.reasoningData) return recommendation?.reasoning || '';
    
    const data = recommendation.reasoningData;
    const parts: string[] = [];
    
    if (data.isExtremeHeat) {
      return t('outfit.reasoning.extremeHeat');
    }
    
    // 层数信息
    if (data.layerCount && data.layerTypes) {
      const layerNames: Record<string, string> = {
        base: t('outfit.reasoning.layerBase'),
        mid: t('outfit.reasoning.layerMid'),
        outer: t('outfit.reasoning.layerOuter')
      };
      const layerDesc = data.layerTypes.map(t => layerNames[t] || t).join('+');
      parts.push(t('outfit.reasoning.layers', { count: data.layerCount, layers: layerDesc }));
    }
    
    // 保暖覆盖率
    if (data.coverage !== undefined) {
      parts.push(t('outfit.reasoning.coverage', { coverage: data.coverage }));
    }
    
    // 场景和目标温度
    const sceneKey = data.scene === 'running' && data.runType 
      ? `runType.${data.runType}` 
      : `scene.${data.scene}`;
    const sceneName = t(sceneKey);
    parts.push(t('outfit.reasoning.target', { scene: sceneName, temp: data.targetTemp }));
    
    // 雨天提示
    if (data.isRaining) {
      parts.push(t('outfit.reasoning.rain'));
    }
    
    return parts.join(' · ');
  }, [recommendation?.reasoningData, recommendation?.reasoning, t]);

  // 生成天气提示
  const getWeatherTips = (): string[] => {
    if (!weather) return [];
    const tips: string[] = [];
    
    // 基于体感温度的提示
    const feelsLike = weather.feelsLike ?? weather.temp;
    if (feelsLike < 5) {
      tips.push(t('outfit.tips.cold'));
    } else if (feelsLike < 10) {
      tips.push(t('outfit.tips.cool'));
    } else if (feelsLike > 32) {
      tips.push(t('outfit.tips.extremeHeat'));
    } else if (feelsLike > 28) {
      tips.push(t('outfit.tips.hot'));
    }
    
    if (weather.windSpeed > 8) {
      tips.push(t('outfit.tips.highWind'));
    } else if (weather.windSpeed > 5) {
      tips.push(t('outfit.tips.wind'));
    }
    if (weather.humidity > 75) {
      tips.push(t('outfit.tips.highHumidity'));
    } else if (weather.humidity < 30) {
      tips.push(t('outfit.tips.lowHumidity'));
    }
    if (weather.isRaining) {
      if (weather.rainLevel === 'light') {
        tips.push(t('outfit.tips.lightRain'));
      } else if (weather.rainLevel === 'moderate') {
        tips.push(t('outfit.tips.moderateRain'));
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

  // ===== 衣柜为空状态 - 现在有虚拟推荐，所以继续展示 =====
  // 不再阻止展示，而是继续渲染推荐（会显示虚拟衣物）
  // if (wardrobeStatus.isEmpty) { ... }


  // ===== 正常状态：显示穿搭推荐 =====
  return (
    <div className="min-h-screen pb-24 animate-fade-in">
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
            onClick={() => handleSceneChange('commute')}
            label={t('scene.commute')}
          />
          <SceneButton 
            active={scene === 'running'} 
            onClick={() => handleSceneChange('running')}
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
                {t('weather.feelsLike')} {weather?.feelsLike ?? 13}°
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
                    <span>{tip}</span>
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

        {/* 虚拟衣物提示 */}
        {recommendation?.hasVirtualItems && (
          <div className="mx-0 mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-orange-500 text-lg">💡</span>
              <div className="flex-1">
                <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">
                  {t('virtual.virtualItemsNotice')}
                </p>
                <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">
                  {t('virtual.virtualItemsDesc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reasoning - 推荐理由卡片 */}
        {recommendation && (
          <Card className="mx-0 mb-3 p-3 bg-primary/5 border-primary/20">
            <p className="text-xs text-foreground/80 text-center">{formattedReasoning}</p>
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
              <div className={`${(recommendation?.layeredTops?.length || 0) > 1 ? 'bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-3 space-y-2' : ''}`}>
                {/* 多层标题 */}
                {(recommendation?.layeredTops?.length || 0) > 1 && (
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{t('outfit.topMatching')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">{(recommendation?.layeredTops?.length || 1)} {t('outfit.layers')}</span>
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
                    layerLabel = t('outfit.innerLayer');
                    layerBadgeColor = 'bg-emerald-100 text-emerald-700';
                  } else if (index === arr.length - 1) {
                    layerLabel = t('outfit.outerLayer');
                    layerBadgeColor = 'bg-amber-100 text-amber-700';
                  } else {
                    layerLabel = t('outfit.middleLayer');
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
                        onAddToWardrobe={layer!.isVirtual ? () => handleAddVirtualToWardrobe(layer!) : undefined}
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
                {t('outfit.addLayer')}
              </button>
            </div>
            <ClothingCard item={recommendation?.outfit.bottom} label={t('clothing.bottom')} icon="👖" onReplace={() => handleReplace('bottom')} onAddToWardrobe={recommendation?.outfit.bottom?.isVirtual ? () => handleAddVirtualToWardrobe(recommendation.outfit.bottom!) : undefined} />
            <ClothingCard item={recommendation?.outfit.socks} label={t('clothing.socks')} icon="🧦" onReplace={() => handleReplace('socks')} onAddToWardrobe={recommendation?.outfit.socks?.isVirtual ? () => handleAddVirtualToWardrobe(recommendation.outfit.socks!) : undefined} />
            <ClothingCard item={recommendation?.outfit.shoes} label={t('clothing.shoes')} icon="👟" onReplace={() => handleReplace('shoes')} onAddToWardrobe={recommendation?.outfit.shoes?.isVirtual ? () => handleAddVirtualToWardrobe(recommendation.outfit.shoes!) : undefined} />
            
            {/* 帽子 - 始终显示（可选） */}
            {recommendation?.outfit.hat ? (
              <ClothingCard 
                item={recommendation.outfit.hat} 
                label="帽子" 
                icon="🧢"
                onReplace={() => handleReplace('hat')}
                onAddToWardrobe={recommendation.outfit.hat.isVirtual ? () => handleAddVirtualToWardrobe(recommendation.outfit.hat!) : undefined}
                deletable
                onDelete={removeHat}
              />
            ) : (
              <ClothingCard 
                showAdd 
                label="帽子" 
                icon="🧢"
                onAdd={handleAddHat}
              />
            )}
          </div>
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
              <h3 className="font-medium">{t('outfit.addLayer')}</h3>
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
                  <span className="text-xs text-muted-foreground">{t('outfit.addAsOuter')}</span>
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

      {/* Floating Action Button - 只在当前 tab 激活时显示 */}
      {mounted && isActive && createPortal(
        <div 
          className="fixed z-[100] flex flex-col items-end" 
          style={{ 
            position: 'fixed',
            right: '16px', 
            bottom: '120px'
          }}
        >
          {/* 菜单向上展开（在按钮上方） */}
          {showActionMenu && (
            <div className="flex flex-col items-end gap-2 mb-2">
              <button
                onClick={() => {
                  generateNewRecommendation();
                  setShowActionMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg text-sm font-medium hover:bg-slate-700 transition-all whitespace-nowrap"
              >
                <RefreshCw size={16} />
                {t('share.refresh')}
              </button>
            <button
              onClick={() => {
                handleSaveOutfit();
                setShowActionMenu(false);
              }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg text-sm font-medium hover:bg-slate-700 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              {t('share.confirm')}
            </button>
            <button
              onClick={() => {
                router.push('/history');
                setShowActionMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg text-sm font-medium hover:bg-slate-700 transition-all whitespace-nowrap"
            >
              <History size={16} />
              {t('share.history')}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg text-sm font-medium hover:bg-slate-700 transition-all whitespace-nowrap"
            >
              <Share2 size={16} />
              {t('share.title')}
            </button>
          </div>
        )}
        
        {/* 主悬浮按钮 */}
        <button
          onClick={() => setShowActionMenu(!showActionMenu)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            showActionMenu 
              ? 'bg-muted rotate-90' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {showActionMenu ? <X size={20} /> : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </button>
        </div>,
        document.body
      )}
      
      {/* 分享弹窗 - 直接展示 DOM 卡片 */}
      {showShareModal && recommendation && weather && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100] flex items-start justify-center pt-12 pb-24 px-4 animate-fade-in overflow-y-auto">
          <Card className="w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-2 flex items-center justify-end">
              <Button variant="ghost" size="icon" onClick={() => setShowShareModal(false)} className="h-7 w-7">
                <XIcon />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {/* 直接渲染分享卡片 DOM */}
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <ShareCard 
                  recommendation={recommendation} 
                  weather={weather} 
                  location={weather.cityName || preferences?.location || (typeof window !== 'undefined' && i18n.language === 'zh' ? '未知位置' : 'Unknown')}
                  shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareId || ''}`}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground">
                  {t('share.linkPasteHint')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ===== Share Card Component =====

function ShareCard({ 
  recommendation, 
  weather, 
  location,
  shareUrl
}: { 
  recommendation: OutfitRecommendation;
  weather: WeatherData;
  location: string;
  shareUrl: string;
}) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  
  // 获取天气图标
  const getWeatherIcon = () => {
    if (weather.isRaining) return '🌧️';
    if (weather.weatherCode && weather.weatherCode >= 801) return '☁️';
    if (weather.weatherCode && weather.weatherCode >= 800) return '☀️';
    return '⛅';
  };
  
  // 获取场景标签 - 使用多语言
  const getSceneLabel = () => {
    const icon = recommendation.outfit.scene === 'commute' ? '🚶' : '🏃';
    let text = '';
    if (recommendation.outfit.scene === 'commute') {
      text = t('scene.commute');
    } else if (recommendation.outfit.runType === 'easy') {
      text = t('runType.easy');
    } else if (recommendation.outfit.runType === 'long') {
      text = t('runType.long');
    } else if (recommendation.outfit.runType === 'interval') {
      text = t('runType.interval');
    } else {
      text = t('scene.running');
    }
    return (
      <>
        <span className="inline-block" style={{ transform: 'translateY(-1px)' }}>{icon}</span>
        <span className="ml-1">{text}</span>
      </>
    );
  };
  
  // 衣物类别标签 - 使用多语言
  const getCategoryLabel = (category: string, index?: number) => {
    if (category === 'top') return t('clothing.top');
    if (category === 'layer') return `${t('outfit.layer')} ${index}`;
    if (category === 'bottom') return t('clothing.bottom');
    if (category === 'socks') return t('clothing.socks');
    if (category === 'shoes') return t('clothing.shoes');
    if (category === 'hat') return t('clothing.hat');
    return category;
  };
  
  // 获取衣物图标
  const getItemIcon = (category: string) => {
    const icons: Record<string, string> = {
      top: '👕',
      bottom: '👖',
      socks: '🧦',
      shoes: '👟',
      hat: '🧢',
    };
    return icons[category] || '👕';
  };
  
  const items = [
    { key: 'top', label: getCategoryLabel('top'), item: recommendation.outfit.top },
    ...(recommendation.layeredTops?.slice(1).map((item, i) => ({ 
      key: 'layer',
      label: getCategoryLabel('layer', i + 2), 
      item 
    })) || []),
    { key: 'bottom', label: getCategoryLabel('bottom'), item: recommendation.outfit.bottom },
    { key: 'socks', label: getCategoryLabel('socks'), item: recommendation.outfit.socks },
    { key: 'shoes', label: getCategoryLabel('shoes'), item: recommendation.outfit.shoes },
    ...(recommendation.outfit.hat ? [{ key: 'hat', label: getCategoryLabel('hat'), item: recommendation.outfit.hat }] : []),
  ];
  
  return (
    <div className="bg-white p-5 w-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{Math.round(weather.temp)}°</div>
          <div className="text-sm text-gray-500 mt-0.5">{location}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl">{getWeatherIcon()}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {t('weather.feelsLike')} {Math.round(weather.feelsLike)}°
          </div>
        </div>
      </div>
      
      {/* 场景标签 - 修复背景色 */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="inline-flex items-center justify-center h-7 px-3 text-sm rounded-full font-medium"
          style={{ backgroundColor: '#1e293b', color: 'white', lineHeight: '1' }}
        >
          {getSceneLabel()}
        </div>
        {recommendation.reasoningData && (
          <span className="text-sm text-gray-500">
            {t('outfit.reasoning.target', { 
              scene: recommendation.outfit.scene === 'commute' ? t('scene.commute') : t('scene.running'),
              temp: recommendation.reasoningData.targetTemp 
            })}
          </span>
        )}
      </div>
      
      {/* 衣物列表 */}
      <div className="space-y-2 mb-4">
        {items.map(({ key, label, item }: { key: string; label: string; item: any }, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex-shrink-0 border border-gray-100 flex items-center justify-center text-base"
              style={{ 
                backgroundColor: item.color && item.color.startsWith('#') ? item.color : '#f1f5f9'
              }}
            >
              {getItemIcon(key)}
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-xs text-gray-400 leading-tight">{label}</div>
              <div className="font-medium text-gray-900 text-sm leading-tight">{item.name}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 推荐理由 - 使用 reasoningData 组装多语言文本 */}
      {recommendation.reasoningData && (
        <div 
          className="rounded-lg p-3 mb-4"
          style={{ backgroundColor: '#f8fafc' }}
        >
          <span className="text-sm text-gray-600 leading-snug">
            {(() => {
              const data = recommendation.reasoningData!;
              const parts: string[] = [];
              
              // 层数信息
              if (data.layerCount && data.layerTypes) {
                const layerNames: Record<string, string> = {
                  base: t('outfit.reasoning.layerBase'),
                  mid: t('outfit.reasoning.layerMid'),
                  outer: t('outfit.reasoning.layerOuter')
                };
                const layerDesc = data.layerTypes.map((t: string) => layerNames[t] || t).join('+');
                parts.push(`${data.layerCount}${isZh ? '层' : ' layers'}(${layerDesc})`);
              }
              
              // 保暖覆盖率
              if (data.coverage !== undefined) {
                parts.push(t('outfit.reasoning.coverage', { coverage: data.coverage }));
              }
              
              // 场景和目标温度
              const sceneLabel = data.scene === 'commute' 
                ? t('scene.commute')
                : data.runType 
                  ? t(`runType.${data.runType}`)
                  : t('scene.running');
              parts.push(t('outfit.reasoning.target', { scene: sceneLabel, temp: data.targetTemp }));
              
              // 雨天提示
              if (data.isRaining) {
                parts.push(t('outfit.reasoning.rain'));
              }
              
              return parts.join(' · ');
            })()}
          </span>
        </div>
      )}
      
      {/* Footer with QR Code */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <div className="text-sm font-semibold text-gray-900">Weather Style</div>
          <div className="text-xs text-gray-400">
            {isZh ? '扫码查看穿搭' : 'Scan to view outfit'}
          </div>
        </div>
        <QRCode url={shareUrl} size={56} />
      </div>
    </div>
  );
}

// QR Code Component
function QRCode({ url, size = 64 }: { url: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');
  
  useEffect(() => {
    import('qrcode').then(QRCodeLib => {
      QRCodeLib.toDataURL(url, { 
        width: size,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      }).then(setDataUrl);
    });
  }, [url, size]);
  
  if (!dataUrl) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded" />;
  
  return <img src={dataUrl} alt="QR Code" style={{ width: size, height: size }} className="rounded" />;
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
