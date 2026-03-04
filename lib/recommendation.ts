import { 
  ClothingItem, 
  WeatherData, 
  OutfitRecommendation, 
  OutfitScene, 
  UserPreferences,
  RunType 
} from '@/types';
import { demoWardrobe } from './demo-wardrobe';

// ============================================
// 活动强度温度配置
// ============================================

// 统一按活动强度配置：目标温度 + 舒适区间 + 产热量
// 注意：目标温度是户外活动的体感舒适温度（室内可以脱衣调节）
const ACTIVITY_CONFIG: Record<string, { 
  target: number; 
  range: [number, number]; 
  heatGain: number;
  label: string;
}> = {
  // 通勤：目标舒适温度 24°C（室内办公/居家舒适温度）
  // 虽然实际户外可能更冷，但用户可以在室内脱衣调节
  commute:  { 
    target: 24,       // 室内舒适温度
    range: [22, 26],  // 舒适区间
    heatGain: 0,      // 静坐无产热
    label: '通勤' 
  },
  // 有氧慢跑：8-15°C
  easy:     { 
    target: 11.5, 
    range: [8, 15], 
    heatGain: 3,      // 中等产热
    label: '有氧跑' 
  },
  // 长距离（半马以上）：7-13°C
  long:     { 
    target: 10, 
    range: [7, 13], 
    heatGain: 4,      // 稳定高产热
    label: '长距离' 
  },
  // 间歇跑（高强度）：5-12°C
  interval: { 
    target: 8.5, 
    range: [5, 12], 
    heatGain: 6,      // 高强度产热
    label: '间歇跑' 
  },
};

// 衣物保暖值映射（warmthLevel 1-10 映射到实际升温值°C）
function getWarmthValue(level: number): number {
  // level 1 = +2°C, level 5 = +8°C, level 10 = +15°C
  return 2 + (level - 1) * 1.3;
}

// 部位权重（不同部位对体感温度贡献不同）
const BODY_PART_WEIGHTS = {
  top: 1.0,      // 上衣：核心保暖
  bottom: 0.6,   // 下装：次要保暖
  socks: 0.2,    // 袜子：足部保暖，影响较小
  shoes: 0,      // 鞋子：不考虑保暖值
  hat: 0.3,      // 帽子：头部散热快，保暖效果明显
};

// ============================================
// 核心温度计算
// ============================================

// 高温兜底阈值
const EXTREME_HEAT_THRESHOLD = 28; // 超过此温度，无论如何穿都热，推荐最薄

// 计算体感温度
// 直接使用天气 API 返回的 feelsLike，再加上活动产热调整
function calculateEffectiveTemp(
  weather: WeatherData, 
  scene: OutfitScene,
  runType?: RunType
): number {
  // 直接使用天气 API 返回的体感温度（已包含湿度、风速等因素）
  let effectiveTemp = weather.feelsLike;
  
  // 仅调整活动产热（人体自身产热，不在天气 API 计算范围内）
  if (scene === 'running' && runType) {
    effectiveTemp -= ACTIVITY_CONFIG[runType].heatGain;
  }
  
  return effectiveTemp;
}

// 判断是否高温兜底场景
function shouldUseMinimumWarmth(effectiveTemp: number): boolean {
  return effectiveTemp >= EXTREME_HEAT_THRESHOLD;
}

// 计算目标保暖总值
function calculateTargetWarmth(
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType
): { 
  neededWarmth: number; 
  effectiveTemp: number;
  targetTemp: number;
  isExtremeHeat: boolean;
  tempRange: [number, number];
} {
  const effectiveTemp = calculateEffectiveTemp(weather, scene, runType);
  
  // 高温兜底：超过 28°C，无论如何穿都热
  if (shouldUseMinimumWarmth(effectiveTemp)) {
    return {
      neededWarmth: 0,
      effectiveTemp,
      targetTemp: 0,
      isExtremeHeat: true,
      tempRange: [0, 0]
    };
  }
  
  // 获取配置
  const config = scene === 'commute' 
    ? ACTIVITY_CONFIG.commute 
    : ACTIVITY_CONFIG[runType || 'easy'];
  
  // 需要的保暖总值 = 目标温度 - 体感温度
  const neededWarmth = config.target - effectiveTemp;
  
  return {
    neededWarmth: Math.max(0, neededWarmth),
    effectiveTemp,
    targetTemp: config.target,
    isExtremeHeat: false,
    tempRange: config.range
  };
}

// 计算单件衣物的实际保暖贡献
function getItemWarmthContribution(item: ClothingItem): number {
  const baseWarmth = getWarmthValue(item.warmthLevel);
  const weight = BODY_PART_WEIGHTS[item.category] || 0;
  return baseWarmth * weight;
}

// 计算整套穿搭的总保暖值
function calculateOutfitWarmth(outfit: {
  top: ClothingItem;
  bottom: ClothingItem;
  socks: ClothingItem;
  shoes: ClothingItem;
  hat?: ClothingItem;
}): number {
  let total = 0;
  total += getItemWarmthContribution(outfit.top);
  total += getItemWarmthContribution(outfit.bottom);
  total += getItemWarmthContribution(outfit.socks);
  if (outfit.hat) {
    total += getItemWarmthContribution(outfit.hat);
  }
  return total;
}

// ============================================
// 场景匹配
// ============================================

// 检查物品是否适合当前场景
function isItemSuitableForScene(item: ClothingItem, scene: OutfitScene): boolean {
  if (scene === 'commute') {
    return item.usage === 'commute' || item.usage === 'both';
  }
  if (scene === 'running') {
    return item.usage === 'running' || item.usage === 'both';
  }
  return true;
}

// ============================================
// 评分算法
// ============================================

// 评分单项衣物
function scoreItem(
  item: ClothingItem, 
  targetWarmth: number, 
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType
): number {
  let score = 0;
  
  // 用户自己的衣物优先（非虚拟衣物获得额外加分）
  if (!item.isVirtual) {
    score += 25; // 用户衣物优先得分
  }
  
  // 场景匹配度（基础分）
  if (item.usage === 'both') {
    score += 5;
  } else if ((scene === 'commute' && item.usage === 'commute') ||
             (scene === 'running' && item.usage === 'running')) {
    score += 20;
  }
  
  // 保暖值匹配度（核心算法）
  const itemWarmth = getItemWarmthContribution(item);
  const warmthDiff = Math.abs(itemWarmth - targetWarmth);
  score += Math.max(0, 50 - warmthDiff * 5); // 越接近目标分数越高
  
  // 天气加成
  if (weather.isRaining && item.waterResistant) {
    score += 15;
  }
  if (weather.windSpeed > 5 && item.windResistant) {
    score += 10;
  }
  
  // 跑步特殊需求
  if (scene === 'running' && runType) {
    if (runType === 'long' && item.category === 'bottom' && item.hasPockets) {
      score += 15;
    }
    if (item.category === 'shoes' && item.subCategory === 'running-shoes') {
      score += 20;
    }
  }
  
  // 通勤特殊需求
  if (scene === 'commute') {
    if (item.category === 'shoes' && 
        (item.subCategory === 'casual-shoes' || item.subCategory === 'slippers')) {
      score += 10;
    }
  }
  
  return score;
}

// 评分帽子
function scoreHat(
  item: ClothingItem,
  weather: WeatherData,
  effectiveTemp: number
): number {
  let score = 0;
  
  const itemWarmth = getItemWarmthContribution(item);
  
  // 寒冷天气优先保暖帽子
  if (effectiveTemp < 5) {
    if (item.subCategory === 'beanie') score += 30;
    score += itemWarmth * 2;
  }
  
  // 炎热天气优先透气帽子
  if (effectiveTemp > 25) {
    if (item.subCategory === 'summer-hat') score += 30;
    if (item.warmthLevel <= 3) score += 15;
  }
  
  // 跑步优先跑步帽
  if (item.subCategory === 'running-hat') score += 10;
  
  // 晴天防晒
  if (!weather.isRaining && weather.weatherCode >= 800) {
    if (item.subCategory === 'summer-hat' || item.subCategory === 'running-hat') {
      score += 5;
    }
  }
  
  return score;
}

// 评分下装（新逻辑）
function scoreBottom(
  item: ClothingItem,
  isCold: boolean,
  effectiveTemp: number,
  scene: OutfitScene,
  neededWarmth?: number
): number {
  let score = 0;
  
  // 场景匹配
  if (item.usage === 'both') score += 10;
  else if ((scene === 'commute' && item.usage === 'commute') ||
           (scene === 'running' && item.usage === 'running')) {
    score += 20;
  }
  
  // 根据保暖需求评分（neededWarmth > 10 表示需要高保暖）
  if (neededWarmth && neededWarmth > 10) {
    // 高保暖需求：优先保暖值高的
    score += item.warmthLevel * 10;
  } else if (isCold && scene === 'commute') {
    // 寒冷天气（通勤场景）：优先保暖值>=7的
    if (item.warmthLevel >= 7) score += 50;
    else score -= 30;
  }
  
  // 跑步场景已有强制规则（5度以上不能长裤），这里只需场景匹配
  if (scene === 'running' && item.subCategory === 'half-tights') {
    score += 10; // 半弹偏好
  }
  
  return score;
}

// 评分袜子（新逻辑）
function scoreSocks(
  item: ClothingItem,
  isCold: boolean,
  scene: OutfitScene
): number {
  let score = 0;
  
  // 场景匹配
  if (item.usage === 'both') score += 10;
  else if ((scene === 'commute' && item.usage === 'commute') ||
           (scene === 'running' && item.usage === 'running')) {
    score += 20;
  }
  
  // 通勤场景+寒冷：优先保暖值>=7的
  if (isCold && scene === 'commute') {
    if (item.warmthLevel >= 7) score += 50;
    else score -= 30;
  }
  
  // 跑步场景：厚袜长袜偏好（保护脚踝）
  if (scene === 'running') {
    if (item.subCategory === 'long-socks' || item.subCategory === 'thick-socks') {
      score += 10;
    }
  }
  
  return score;
}

// 评分鞋子（新逻辑）
function scoreShoes(
  item: ClothingItem,
  isCold: boolean,
  scene: OutfitScene,
  weather: WeatherData
): number {
  let score = 0;
  
  // 场景匹配
  if (scene === 'running' && item.subCategory === 'running-shoes') {
    score += 30; // 跑步场景强偏好跑鞋
  }
  if (scene === 'commute' && 
      (item.subCategory === 'casual-shoes' || item.subCategory === 'slippers')) {
    score += 20;
  }
  
  // 通勤场景+寒冷：优先保暖值>=7的
  if (isCold && scene === 'commute') {
    if (item.warmthLevel >= 7) score += 50;
    else score -= 30;
  }
  
  // 雨天防水
  if (weather.isRaining && item.waterResistant) {
    score += 15;
  }
  
  return score;
}

// ============================================
// 天气提示
// ============================================

function generateWeatherTips(weather: WeatherData): string[] {
  const tips: string[] = [];
  
  if (weather.windSpeed > 8) {
    tips.push('今日风较大，注意防风');
  } else if (weather.windSpeed > 5) {
    tips.push('有风，建议备件防风外套');
  }
  
  if (weather.humidity > 80) {
    tips.push('湿度大，体感偏闷热，注意透气');
  } else if (weather.humidity < 30) {
    tips.push('空气干燥，及时补水');
  }
  
  if (weather.isRaining) {
    if (weather.rainLevel === 'light') {
      tips.push('下小雨，路面湿滑注意安全');
    } else if (weather.rainLevel === 'moderate') {
      tips.push('下中雨，建议室内或延期');
    } else if (weather.rainLevel === 'heavy') {
      tips.push('下大雨，不建议户外跑步');
    }
  }
  
  return tips;
}

// ============================================
// 推荐理由生成 - 返回结构化的理由数据，支持 i18n
// ============================================

export interface ReasoningData {
  layerCount?: number;
  layerTypes?: LayerType[];
  coverage?: number;
  scene: OutfitScene;
  runType?: RunType;
  targetTemp: number;
  isRaining: boolean;
  isExtremeHeat: boolean;
}

function generateReasoningData(
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType,
  effectiveTemp?: number,
  outfitWarmth?: number,
  neededWarmth?: number,
  layerTypes?: LayerType[],
  isExtremeHeat?: boolean,
  tempRange?: [number, number]
): ReasoningData {
  const targetTemp = scene === 'running' && runType 
    ? ACTIVITY_CONFIG[runType].target 
    : ACTIVITY_CONFIG.commute.target;
    
  const coverage = neededWarmth !== undefined && outfitWarmth !== undefined && neededWarmth > 0
    ? Math.min(100, Math.round((outfitWarmth / neededWarmth) * 100))
    : undefined;
  
  return {
    layerCount: layerTypes?.length,
    layerTypes,
    coverage,
    scene,
    runType,
    targetTemp,
    isRaining: weather.isRaining,
    isExtremeHeat: isExtremeHeat ?? false
  };
}

// 兼容旧版：返回字符串（组件层应改用 generateReasoningData 自行组装）
function generateReasoning(
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType,
  effectiveTemp?: number,
  outfitWarmth?: number,
  neededWarmth?: number,
  layerTypes?: LayerType[],
  isExtremeHeat?: boolean,
  tempRange?: [number, number]
): string {
  const data = generateReasoningData(weather, scene, runType, effectiveTemp, outfitWarmth, neededWarmth, layerTypes, isExtremeHeat, tempRange);
  
  if (data.isExtremeHeat) {
    return 'Extreme heat, lightweight recommended';
  }
  
  const parts: string[] = [];
  
  if (data.layerCount && data.layerTypes) {
    const layerNames: Record<LayerType, string> = {
      base: 'Base',
      mid: 'Mid',
      outer: 'Outer'
    };
    const layerDesc = data.layerTypes.map(t => layerNames[t]).join('+');
    parts.push(`${data.layerCount} layers(${layerDesc})`);
  }
  
  if (data.coverage !== undefined) {
    parts.push(`${data.coverage}% warmth`);
  }
  
  const sceneLabel = data.scene === 'running' && data.runType
    ? data.runType.charAt(0).toUpperCase() + data.runType.slice(1)
    : 'Commute';
  parts.push(`${sceneLabel}, target ${data.targetTemp}°C`);
  
  if (data.isRaining) {
    parts.push('Waterproof priority');
  }
  
  return parts.join(' · ');
}

// ============================================
// 自动分层算法
// ============================================

type LayerType = 'base' | 'mid' | 'outer';

// 根据衣物属性自动判断层级
function getLayerType(item: ClothingItem): LayerType {
  // 特殊子类别优先判断
  const subCategoryLayerMap: Record<string, LayerType> = {
    't-shirt': 'base',
    'tank-top': 'base',
    'long-sleeve': 'base',
    'shirt': 'base',
    
    'hoodie': 'mid',
    'sweater': 'mid',
    'fleece': 'mid',
    'cotton-padded': 'mid',
    
    'jacket': 'outer',
    'windbreaker': 'outer',
    'down-jacket': 'outer',
    'wind-shirt': 'outer',
  };
  
  if (subCategoryLayerMap[item.subCategory]) {
    return subCategoryLayerMap[item.subCategory];
  }
  
  // 根据保暖值推断
  if (item.warmthLevel <= 3) return 'base';
  if (item.warmthLevel <= 6) return 'mid';
  return 'outer';
}

// 根据目标温度决定需要哪些层
function getRequiredLayers(neededWarmth: number, weather: WeatherData, scene: OutfitScene): LayerType[] {
  const layers: LayerType[] = ['base']; // 打底必须
  
  // 通勤场景：温差>2度就需要两件（打底+外层）
  // 跑步场景：体感<6度需要两件
  const needsTwoLayers = scene === 'commute' 
    ? neededWarmth > 2  // 通勤：目标22度，体感<20度就要两件
    : neededWarmth > 6; // 跑步：体感<目标温度-6度就要两件
  
  if (needsTwoLayers) {
    layers.push('mid');
  }
  
  if (neededWarmth > 8 || weather.isRaining || weather.windSpeed > 5) {
    layers.push('outer');
  }
  
  return layers;
}

// ============================================
// 强制规则检查
// ============================================

// 检查是否满足强制规则
function checkMandatoryRules(
  item: ClothingItem,
  category: string,
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType,
  effectiveTemp?: number
): boolean {
  // 规则1：通勤+下雨时，上衣必须是冲锋衣
  if (scene === 'commute' && weather.isRaining && category === 'top') {
    return item.subCategory === 'windbreaker' || item.waterResistant === true;
  }
  
  // 规则2：跑步+长距离时，裤子必须有口袋
  if (scene === 'running' && runType === 'long' && category === 'bottom') {
    return item.hasPockets === true;
  }
  
  // 规则3：跑步场景+温度>5度时，下装不能是长裤（推荐短裤/半弹）
  if (scene === 'running' && category === 'bottom' && effectiveTemp !== undefined) {
    if (effectiveTemp > 5) {
      // 5度以上，不能穿长裤
      return item.subCategory !== 'pants';
    }
  }
  
  return true;
}

// ============================================
// 智能分层穿衣组合算法
// ============================================

interface LayeredTop {
  layers: ClothingItem[];
  totalWarmth: number;
  score: number;
  layerTypes: LayerType[];
}

// 基于自动分层的智能组合
function generateTopLayers(
  tops: ClothingItem[],
  targetWarmth: number,
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType
): LayeredTop[] {
  const combinations: LayeredTop[] = [];
  
  // 按层级分类
  const baseLayers = tops.filter(t => getLayerType(t) === 'base');
  const midLayers = tops.filter(t => getLayerType(t) === 'mid');
  const outerLayers = tops.filter(t => getLayerType(t) === 'outer');
  
  // 确定需要哪些层
  const requiredLayers = getRequiredLayers(targetWarmth, weather, scene);
  
  // 方案1：单层方案（只用一层）
  // 温差大时（目标保暖值 > 6），单层 base 层无法提供足够保暖，跳过
  const allowSingleLayer = targetWarmth <= 6;
  
  if (allowSingleLayer) {
    for (const top of tops) {
      const layerType = getLayerType(top);
      
      // 所有场景下，mid 层（棉服、抓绒、卫衣）和 outer 层（冲锋衣、羽绒服）都不能单穿
      // 必须有 base 层（T恤、长袖、背心）打底
      if (layerType === 'mid' || layerType === 'outer') {
        continue; // 跳过 mid 和 outer 单穿
      }
      
      const warmth = getItemWarmthContribution(top);
      const score = scoreItem(top, targetWarmth, weather, scene, runType);
      combinations.push({
        layers: [top],
        totalWarmth: warmth,
        score,
        layerTypes: [layerType]
      });
    }
  }
  
  // 方案2：双层（打底+外层）
  if (requiredLayers.length >= 2) {
    // 2a: 打底 + mid/outer
    for (const base of baseLayers) {
      for (const outer of [...midLayers, ...outerLayers]) {
        if (base.id === outer.id) continue;
        
        const combinedWarmth = getItemWarmthContribution(base) + 
                               getItemWarmthContribution(outer) * 0.85;
        
        const score = scoreLayerCombination(
          [base, outer], 
          ['base', getLayerType(outer)],
          targetWarmth, 
          weather, 
          scene, 
          runType
        );
        
        combinations.push({
          layers: [base, outer],
          totalWarmth: combinedWarmth,
          score,
          layerTypes: ['base', getLayerType(outer)]
        });
      }
    }
    
    // 2b: 打底 + 打底（两件轻薄打底）
    for (let i = 0; i < baseLayers.length; i++) {
      for (let j = i + 1; j < baseLayers.length; j++) {
        const base1 = baseLayers[i];
        const base2 = baseLayers[j];
        
        const combinedWarmth = getItemWarmthContribution(base1) + 
                               getItemWarmthContribution(base2) * 0.9;
        
        const score = scoreLayerCombination(
          [base1, base2], 
          ['base', 'base'],
          targetWarmth, 
          weather, 
          scene, 
          runType
        );
        
        combinations.push({
          layers: [base1, base2],
          totalWarmth: combinedWarmth,
          score: score - 5, // 双层打底略减分
          layerTypes: ['base', 'base']
        });
      }
    }
    
    // 2c: mid + outer（无打底，适合不太冷的情况）
    for (const mid of midLayers) {
      for (const outer of outerLayers) {
        if (mid.id === outer.id) continue;
        
        const combinedWarmth = getItemWarmthContribution(mid) * 0.9 + 
                               getItemWarmthContribution(outer) * 0.8;
        
        const score = scoreLayerCombination(
          [mid, outer], 
          ['mid', 'outer'],
          targetWarmth, 
          weather, 
          scene, 
          runType
        );
        
        combinations.push({
          layers: [mid, outer],
          totalWarmth: combinedWarmth,
          score: score - 10, // 无打底大幅减分
          layerTypes: ['mid', 'outer']
        });
      }
    }
  }
  
  // 方案3：三层（打底+中间+外层）- 温差大时启用
  if (requiredLayers.length >= 3 && targetWarmth > 6) {
    for (const base of baseLayers) {
      for (const mid of midLayers) {
        for (const outer of outerLayers) {
          if (base.id === mid.id || base.id === outer.id || mid.id === outer.id) continue;
          
          const combinedWarmth = getItemWarmthContribution(base) + 
                                 getItemWarmthContribution(mid) * 0.9 +
                                 getItemWarmthContribution(outer) * 0.8;
          
          const score = scoreLayerCombination(
            [base, mid, outer],
            ['base', 'mid', 'outer'],
            targetWarmth,
            weather,
            scene,
            runType
          );
          
          // 三层有额外加成
          combinations.push({
            layers: [base, mid, outer],
            totalWarmth: combinedWarmth,
            score: score + 10, // 三层完整性加分
            layerTypes: ['base', 'mid', 'outer']
          });
        }
      }
    }
  }
  
  // 严格过滤：只保留 80%-120% 范围内的组合
  const validCombinations = combinations.filter(c => {
    const coverage = c.totalWarmth / targetWarmth;
    return coverage >= 0.8 && coverage <= 1.2;
  });
  
  // 如果有符合条件的组合，按分数排序返回
  if (validCombinations.length > 0) {
    return validCombinations.sort((a, b) => b.score - a.score);
  }
  
  // 没有80-120%的组合时，找最接近的（优先偏暖）
  // 按与100%的差距排序，优先选择保暖值更高的（避免太冷）
  const sortedByCoverage = combinations
    .map(c => ({ ...c, coverage: c.totalWarmth / targetWarmth }))
    .sort((a, b) => {
      // 优先选择 >=80% 的，其次是接近80%的
      const aValid = a.coverage >= 0.8;
      const bValid = b.coverage >= 0.8;
      if (aValid && !bValid) return -1;
      if (!aValid && bValid) return 1;
      // 都有效或都无效时，按与目标差距排序
      return Math.abs(a.coverage - 1) - Math.abs(b.coverage - 1);
    });
  
  return sortedByCoverage;
}

// 评分分层组合
function scoreLayerCombination(
  layers: ClothingItem[],
  layerTypes: LayerType[],
  targetWarmth: number,
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType
): number {
  const totalWarmth = layers.reduce((sum, layer, idx) => {
    const weight = [1, 0.85, 0.7][idx] || 0.6;
    return sum + getItemWarmthContribution(layer) * weight;
  }, 0);
  
  // 保暖匹配度 - 温差越大扣分越多
  const warmthDiff = Math.abs(totalWarmth - targetWarmth);
  let warmthScore = Math.max(0, 80 - warmthDiff * 5);
  
  // 刚好够暖有额外加分（90%-110%最佳范围内）
  const coverage = totalWarmth / targetWarmth;
  if (coverage >= 0.9 && coverage <= 1.1) {
    warmthScore += 30; // 最佳范围大幅加分
  } else if (coverage >= 0.8 && coverage <= 1.2) {
    warmthScore += 10; // 可接受范围小加分
  }
  
  // 低于80%或高于120%要大幅扣分
  if (coverage < 0.8 || coverage > 1.2) {
    warmthScore -= 20;
  }
  
  // 温差大时，多层组合有额外加成
  if (targetWarmth > 8 && layers.length >= 2) {
    warmthScore += 20; // 鼓励多层穿搭
  }
  
  // 各层单独评分平均
  const layerScores = layers.map((layer, idx) => {
    const layerTarget = targetWarmth * [0.35, 0.5, 0.35][idx] || targetWarmth * 0.35;
    return scoreItem(layer, layerTarget, weather, scene, runType);
  });
  const avgLayerScore = layerScores.reduce((a, b) => a + b, 0) / layers.length;
  
  // 分层合理性加分
  let structureBonus = 0;
  if (layerTypes[0] === 'base') structureBonus += 10;
  if (layers.length >= 2 && (layerTypes[1] === 'mid' || layerTypes[1] === 'outer')) {
    structureBonus += 15;
  }
  
  return warmthScore + avgLayerScore + structureBonus;
}

// ============================================
// 高温兜底：选择最薄衣物
// ============================================

function generateMinimumWarmthOutfit(
  wardrobe: {
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    socks: ClothingItem[];
    shoes: ClothingItem[];
    hats?: ClothingItem[];
  },
  weather: WeatherData,
  scene: OutfitScene,
  runType: RunType | undefined,
  effectiveTemp: number
): OutfitRecommendation & { layeredTops?: ClothingItem[] } {
  // 过滤适合场景的衣物
  let filteredTops = wardrobe.tops.filter(item => isItemSuitableForScene(item, scene));
  let filteredBottoms = wardrobe.bottoms.filter(item => isItemSuitableForScene(item, scene));
  let filteredSocks = wardrobe.socks.filter(item => isItemSuitableForScene(item, scene));
  let filteredShoes = wardrobe.shoes.filter(item => isItemSuitableForScene(item, scene));
  let filteredHats = wardrobe.hats?.filter(item => isItemSuitableForScene(item, scene));
  
  // 检查是否使用示例衣物
  const useDemoTops = filteredTops.length === 0;
  const useDemoBottoms = filteredBottoms.length === 0;
  const useDemoSocks = filteredSocks.length === 0;
  const useDemoShoes = filteredShoes.length === 0;
  const useDemoHats = !filteredHats || filteredHats.length === 0;
  const hasVirtualItems = useDemoTops || useDemoBottoms || useDemoSocks || useDemoShoes || useDemoHats;
  
  // 混入示例衣物 - 高温时使用全部示例衣物（优先轻薄）
  if (useDemoTops) filteredTops = demoWardrobe.tops;
  if (useDemoBottoms) filteredBottoms = demoWardrobe.bottoms;
  if (useDemoSocks) filteredSocks = demoWardrobe.socks;
  if (useDemoShoes) filteredShoes = demoWardrobe.shoes;
  if (useDemoHats) filteredHats = demoWardrobe.hats;
  
  // 选择最薄的衣物（warmthLevel 最小）
  const top = [...filteredTops].sort((a, b) => a.warmthLevel - b.warmthLevel)[0]!;
  const bottom = [...filteredBottoms].sort((a, b) => a.warmthLevel - b.warmthLevel)[0]!;
  const socks = [...filteredSocks].sort((a, b) => a.warmthLevel - b.warmthLevel)[0]!;
  
  // 鞋子选择透气性好的（跑步场景优先跑鞋）
  const shoes = filteredShoes
    .sort((a, b) => {
      if (scene === 'running') {
        // 优先跑步鞋
        if (a.subCategory === 'running-shoes' && b.subCategory !== 'running-shoes') return -1;
        if (b.subCategory === 'running-shoes' && a.subCategory !== 'running-shoes') return 1;
      }
      return a.warmthLevel - b.warmthLevel;
    })[0]!;
  
  // 炎热天气推荐遮阳帽
  const hat = filteredHats?.length
    ? filteredHats
        .sort((a, b) => {
          // 优先夏季帽子/空顶帽
          if (a.subCategory === 'summer-hat') return -1;
          if (b.subCategory === 'summer-hat') return 1;
          return a.warmthLevel - b.warmthLevel;
        })[0]
    : undefined;
  
  // 生成天气提示
  const weatherTips = [
    '天气炎热，建议晨跑或夜跑避开高温',
    '注意补水和防晒',
    ...generateWeatherTips(weather)
  ];
  
  const reasoningData = generateReasoningData(
    weather, 
    scene, 
    runType, 
    effectiveTemp, 
    0, 
    0,
    ['base'],
    true  // isExtremeHeat
  );
  
  const reasoning = generateReasoning(
    weather, 
    scene, 
    runType, 
    effectiveTemp, 
    0, 
    0,
    ['base'],
    true
  );
  
  return {
    outfit: {
      top: top!,
      bottom: bottom!,
      socks: socks!,
      shoes: shoes!,
      hat,
      scene,
      runType,
      weatherSnapshot: weather,
    },
    reasoning,
    reasoningData,
    weatherTips,
    alternatives: {
      top: [],
      bottom: [],
      socks: [],
      shoes: [],
      hat: [],
    },
    layeredTops: undefined,
    hasVirtualItems,
  };
}

// ============================================
// 主推荐函数
// ============================================

export function generateRecommendation(
  wardrobe: {
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    socks: ClothingItem[];
    shoes: ClothingItem[];
    hats?: ClothingItem[];
  },
  weather: WeatherData,
  preferences: UserPreferences,
  scene: OutfitScene,
  runType?: RunType,
  excludeItems?: { topId?: string; bottomId?: string; socksId?: string; shoesId?: string },
  combinationIndex: number = 0
): OutfitRecommendation & { layeredTops?: ClothingItem[] } {
  // 计算需要的保暖值（核心温度）
  const { 
    neededWarmth, 
    effectiveTemp, 
    targetTemp,
    isExtremeHeat,
    tempRange 
  } = calculateTargetWarmth(weather, scene, runType);
  
  // 高温兜底：选择最薄的衣物
  if (isExtremeHeat) {
    return generateMinimumWarmthOutfit(wardrobe, weather, scene, runType, effectiveTemp);
  }
  
  // 过滤适合场景的物品 - 用户衣物优先
  let userTops = wardrobe.tops.filter(item => isItemSuitableForScene(item, scene));
  let userBottoms = wardrobe.bottoms.filter(item => isItemSuitableForScene(item, scene));
  let userSocks = wardrobe.socks.filter(item => isItemSuitableForScene(item, scene));
  let userShoes = wardrobe.shoes.filter(item => isItemSuitableForScene(item, scene));
  let userHats = wardrobe.hats?.filter(item => isItemSuitableForScene(item, scene));
  
  // 检查是否使用示例衣物（当用户衣柜为空时）
  const useDemoTops = userTops.length === 0;
  const useDemoBottoms = userBottoms.length === 0;
  const useDemoSocks = userSocks.length === 0;
  const useDemoShoes = userShoes.length === 0;
  const useDemoHats = !userHats || userHats.length === 0;
  
  // 标记是否有使用示例衣物（用于UI展示）
  const hasVirtualItems = useDemoTops || useDemoBottoms || useDemoSocks || useDemoShoes || useDemoHats;
  
  // 根据保暖需求决定过滤策略
  // 高保暖需求时：使用全部示例衣物（忽略场景，优先保暖）
  // 低保暖需求时：按场景过滤
  const needHighWarmth = neededWarmth > 10;
  
  const demoTopsFiltered = needHighWarmth 
    ? demoWardrobe.tops 
    : demoWardrobe.tops.filter(item => isItemSuitableForScene(item, scene));
  const demoBottomsFiltered = needHighWarmth 
    ? demoWardrobe.bottoms 
    : demoWardrobe.bottoms.filter(item => isItemSuitableForScene(item, scene));
  const demoSocksFiltered = needHighWarmth 
    ? demoWardrobe.socks 
    : demoWardrobe.socks.filter(item => isItemSuitableForScene(item, scene));
  const demoShoesFiltered = needHighWarmth 
    ? demoWardrobe.shoes 
    : demoWardrobe.shoes.filter(item => isItemSuitableForScene(item, scene));
  const demoHatsFiltered = needHighWarmth 
    ? demoWardrobe.hats 
    : demoWardrobe.hats.filter(item => isItemSuitableForScene(item, scene));
  
  // 优先使用用户衣物，不够的补充虚拟衣物
  // 策略：用户衣物 + 虚拟衣物，但让算法优先选择用户衣物（通过评分实现）
  let filteredTops = [...userTops, ...demoTopsFiltered];
  let filteredBottoms = [...userBottoms, ...demoBottomsFiltered];
  let filteredSocks = [...userSocks, ...demoSocksFiltered];
  let filteredShoes = [...userShoes, ...demoShoesFiltered];
  let filteredHats = userHats ? [...userHats, ...demoHatsFiltered] : demoHatsFiltered;
  
  // 检查上衣是否有足够的保暖选择（mid/outer层）
  const hasWarmLayers = filteredTops.some(t => {
    const layerType = getLayerType(t);
    return layerType === 'mid' || layerType === 'outer';
  });
  
  // 如果需要保暖（温度低）且过滤后没有保暖层，回退到全部上衣
  if (neededWarmth > 8 && !hasWarmLayers) {
    filteredTops = useDemoTops ? demoWardrobe.tops : wardrobe.tops;
  }
  
  // 应用强制规则
  const mandatoryTops = filteredTops.filter(item => 
    checkMandatoryRules(item, 'top', weather, scene, runType, effectiveTemp)
  );
  const mandatoryBottoms = filteredBottoms.filter(item => 
    checkMandatoryRules(item, 'bottom', weather, scene, runType, effectiveTemp)
  );
  
  // 如果有满足强制规则的，优先使用；否则回退
  const topsToUse = mandatoryTops.length > 0 ? mandatoryTops : filteredTops;
  const bottomsToUse = mandatoryBottoms.length > 0 ? mandatoryBottoms : filteredBottoms;
  
  // 如果过滤后为空，回退到全部（使用示例衣物时回退到示例库）
  const finalTops = topsToUse.length > 0 ? topsToUse : (useDemoTops ? demoWardrobe.tops : wardrobe.tops);
  const finalBottoms = bottomsToUse.length > 0 ? bottomsToUse : (useDemoBottoms ? demoWardrobe.bottoms : wardrobe.bottoms);
  const finalSocks = filteredSocks.length > 0 ? filteredSocks : (useDemoSocks ? demoWardrobe.socks : wardrobe.socks);
  const finalShoes = filteredShoes.length > 0 ? filteredShoes : (useDemoShoes ? demoWardrobe.shoes : wardrobe.shoes);
  const finalHats = filteredHats && filteredHats.length > 0 ? filteredHats : (useDemoHats ? demoWardrobe.hats : wardrobe.hats);
  
  // 排除已推荐的物品
  const topsForRecommendation = excludeItems?.topId 
    ? finalTops.filter(t => t.id !== excludeItems.topId)
    : finalTops;
  const bottomsForRecommendation = excludeItems?.bottomId
    ? finalBottoms.filter(b => b.id !== excludeItems.bottomId)
    : finalBottoms;
  const socksForRecommendation = excludeItems?.socksId
    ? finalSocks.filter(s => s.id !== excludeItems.socksId)
    : finalSocks;
  const shoesForRecommendation = excludeItems?.shoesId
    ? finalShoes.filter(s => s.id !== excludeItems.shoesId)
    : finalShoes;
  
  // 如果排除后为空，回退到原列表
  const topsToRecommend = topsForRecommendation.length > 0 ? topsForRecommendation : finalTops;
  const bottomsToRecommend = bottomsForRecommendation.length > 0 ? bottomsForRecommendation : finalBottoms;
  const socksToRecommend = socksForRecommendation.length > 0 ? socksForRecommendation : finalSocks;
  const shoesToRecommend = shoesForRecommendation.length > 0 ? shoesForRecommendation : finalShoes;
  
  // 核心保暖：上衣（可能多层）+ 帽子 要匹配 neededWarmth
  // 先生成帽子候选（因为帽子保暖值需要计入核心保暖）
  const scoredHats = finalHats && finalHats.length > 0
    ? finalHats
        .map(item => ({ item, score: scoreHat(item, weather, effectiveTemp) }))
        .sort((a, b) => b.score - a.score)
    : [];
  
  // 计算帽子提供的保暖值（选择最佳帽子）
  const bestHat = scoredHats[0]?.item;
  const hatWarmthContribution = bestHat ? getItemWarmthContribution(bestHat) : 0;
  
  // 上衣需要提供的保暖值 = 核心保暖 - 帽子保暖
  const topTargetWarmth = Math.max(0, neededWarmth - hatWarmthContribution);
  
  // 使用多层算法选择上衣 - 支持多个组合轮换
  const layeredTopOptions = generateTopLayers(topsToRecommend, topTargetWarmth, weather, scene, runType);
  
  // 去重：基于每层类型和保暖值的组合签名去重
  const seenSignatures = new Set<string>();
  const uniqueOptions = layeredTopOptions.filter(opt => {
    const signature = opt.layers.map(l => `${getLayerType(l)}-${l.warmthLevel}`).sort().join(',');
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
  
  // 循环选择组合
  const selectedIndex = uniqueOptions.length > 0 ? (combinationIndex % uniqueOptions.length) : 0;
  const bestTopCombination = uniqueOptions[selectedIndex] || uniqueOptions[0] || { layers: [], totalWarmth: 0, score: 0, layerTypes: [] };
  const mainTop = bestTopCombination.layers[bestTopCombination.layers.length - 1];
  
  // 如果多层算法没有返回结果，从可用上衣中选择一个
  const fallbackTop = !mainTop && topsToRecommend.length > 0 
    ? topsToRecommend[0] 
    : undefined;
  const top = mainTop || fallbackTop;
  
  // 其他部位根据场景选择
  // 通勤场景：温度<6度时，袜子、鞋子、裤子都要保暖值>=7
  // 跑步场景：鞋子、袜子不考虑保暖值，裤子已有强制规则
  const isCold = effectiveTemp < 6;
  
  // 下装选择
  const scoredBottoms = bottomsToRecommend
    .map(item => ({ 
      item, 
      score: scoreBottom(item, isCold, effectiveTemp, scene, neededWarmth) 
    }))
    .sort((a, b) => b.score - a.score);
  
  // 袜子选择
  const scoredSocks = socksToRecommend
    .map(item => ({ 
      item, 
      score: scoreSocks(item, isCold, scene) 
    }))
    .sort((a, b) => b.score - a.score);
  
  // 鞋子选择
  const scoredShoes = shoesToRecommend
    .map(item => ({ 
      item, 
      score: scoreShoes(item, isCold, scene, weather) 
    }))
    .sort((a, b) => b.score - a.score);
  
  // 选择各部位最佳
  const layeredTops = bestTopCombination.layers.length > 1 ? bestTopCombination.layers : undefined;
  const bottom = scoredBottoms[0]?.item;
  const socks = scoredSocks[0]?.item;
  const shoes = scoredShoes[0]?.item;
  
  // 极端天气才推荐帽子
  const shouldRecommendHat = effectiveTemp < 8 || effectiveTemp > 30 || weather.isRaining;
  const hat = shouldRecommendHat && scoredHats.length > 0 ? scoredHats[0].item : undefined;
  
  // 计算实际保暖值（核心保暖：上衣+帽子，与 neededWarmth 对应）
  const topWarmth = top ? getItemWarmthContribution(top) : 0;
  const coreWarmth = topWarmth + 
    (layeredTops ? bestTopCombination.totalWarmth - topWarmth : 0) +
    (hat ? getItemWarmthContribution(hat) : 0);
  
  // 检查保暖值是否在80-120%范围内，如果不是，尝试找更好的组合
  const coverage = neededWarmth > 0 ? coreWarmth / neededWarmth : 1;
  if (coverage < 0.8 || coverage > 1.2) {
    console.warn(`[generateRecommendation] Coverage out of range: ${(coverage * 100).toFixed(0)}%, trying to find better combination`);
  }
  
  // 生成提示和理由
  const weatherTips = generateWeatherTips(weather);
  const reasoningData = generateReasoningData(
    weather, 
    scene, 
    runType, 
    effectiveTemp, 
    coreWarmth, 
    neededWarmth,
    bestTopCombination.layerTypes,
    isExtremeHeat,
    tempRange
  );
  const reasoning = generateReasoning(
    weather, 
    scene, 
    runType, 
    effectiveTemp, 
    coreWarmth, 
    neededWarmth,
    bestTopCombination.layerTypes,
    isExtremeHeat,
    tempRange
  );
  
  // 多层时不显示单层备选，避免混淆
  const topAlternatives: ClothingItem[] = [];
  
  return {
    outfit: {
      top: top!,
      bottom: bottom!,
      socks: socks!,
      shoes: shoes!,
      hat,
      scene,
      runType,
      weatherSnapshot: weather,
    },
    reasoning,
    reasoningData,
    weatherTips,
    alternatives: {
      top: topAlternatives,
      bottom: scoredBottoms.slice(1, 4).map(s => s.item),
      socks: scoredSocks.slice(1, 4).map(s => s.item),
      shoes: scoredShoes.slice(1, 4).map(s => s.item),
      hat: scoredHats.slice(1, 4).map(s => s.item),
    },
    layeredTops,
    hasVirtualItems,
  };
}
