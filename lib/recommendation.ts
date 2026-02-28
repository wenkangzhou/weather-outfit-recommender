import { 
  ClothingItem, 
  WeatherData, 
  OutfitRecommendation, 
  OutfitScene, 
  UserPreferences,
  RunType 
} from '@/types';

// ============================================
// 温度算法配置
// ============================================

// 场景目标舒适温度（体感温度）
const TARGET_TEMPS = {
  commute: 25,      // 通勤：舒适办公温度
  running: {
    easy: 18,       // 有氧跑：舒适，产热少
    long: 15,       // 长距离：稍凉，稳定产热
    interval: 12,   // 间歇：更凉，高强度产热多
  }
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

// 计算体感温度
function calculateEffectiveTemp(
  weather: WeatherData, 
  scene: OutfitScene,
  runType?: RunType
): number {
  let effectiveTemp = weather.feelsLike;
  
  // 湿度影响
  if (weather.humidity > 80) {
    if (effectiveTemp > 20) {
      effectiveTemp += 2; // 闷热
    } else if (effectiveTemp < 10) {
      effectiveTemp -= 2; // 湿冷
    }
  }
  
  // 跑步产热调整（降低目标感知温度）
  if (scene === 'running' && runType) {
    switch (runType) {
      case 'easy':
        effectiveTemp -= 2;  // 有氧：轻微产热
        break;
      case 'long':
        effectiveTemp -= 4;  // 长距离：中等产热
        break;
      case 'interval':
        effectiveTemp -= 6;  // 间歇：高强度产热
        break;
    }
  }
  
  return effectiveTemp;
}

// 计算目标保暖总值
function calculateTargetWarmth(
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType
): number {
  const effectiveTemp = calculateEffectiveTemp(weather, scene, runType);
  
  // 获取目标舒适温度
  let targetTemp: number;
  if (scene === 'commute') {
    targetTemp = TARGET_TEMPS.commute;
  } else {
    targetTemp = TARGET_TEMPS.running[runType || 'easy'];
  }
  
  // 需要的保暖总值 = 目标温度 - 体感温度
  const neededWarmth = targetTemp - effectiveTemp;
  
  return Math.max(0, neededWarmth); // 不能为负（不需要降温）
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
// 推荐理由生成
// ============================================

function generateReasoning(
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType,
  effectiveTemp?: number,
  outfitWarmth?: number,
  neededWarmth?: number,
  layerTypes?: LayerType[]
): string {
  const reasons: string[] = [];
  
  if (effectiveTemp !== undefined) {
    reasons.push(`体感 ${Math.round(effectiveTemp)}°C`);
  }
  
  // 显示分层信息
  if (layerTypes && layerTypes.length > 0) {
    const layerNames: Record<LayerType, string> = {
      base: '打底',
      mid: '中间',
      outer: '外层'
    };
    const layerDesc = layerTypes.map(t => layerNames[t]).join('+');
    reasons.push(`${layerTypes.length}层(${layerDesc})`);
  }
  
  if (neededWarmth !== undefined && outfitWarmth !== undefined) {
    const coverage = Math.min(100, Math.round((outfitWarmth / neededWarmth) * 100));
    reasons.push(`保暖${coverage}%`);
  }
  
  if (scene === 'running' && runType) {
    const runTypeLabels: Record<RunType, string> = {
      easy: '有氧跑，目标 18°C',
      long: '长距离，目标 15°C',
      interval: '间歇跑，目标 12°C',
    };
    reasons.push(runTypeLabels[runType]);
  }
  
  if (weather.isRaining) {
    reasons.push('雨天优先防水');
  }
  
  return reasons.join(' · ');
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
function getRequiredLayers(neededWarmth: number, weather: WeatherData): LayerType[] {
  const layers: LayerType[] = ['base']; // 打底必须
  
  if (neededWarmth > 4) {
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
  runType?: RunType
): boolean {
  // 规则1：通勤+下雨时，上衣必须是冲锋衣
  if (scene === 'commute' && weather.isRaining && category === 'top') {
    return item.subCategory === 'windbreaker' || item.waterResistant === true;
  }
  
  // 规则2：跑步+长距离时，裤子必须有口袋
  if (scene === 'running' && runType === 'long' && category === 'bottom') {
    return item.hasPockets === true;
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
  const requiredLayers = getRequiredLayers(targetWarmth, weather);
  
  // 方案1：单层方案（只用一层）
  for (const top of tops) {
    const warmth = getItemWarmthContribution(top);
    const score = scoreItem(top, targetWarmth, weather, scene, runType);
    combinations.push({
      layers: [top],
      totalWarmth: warmth,
      score,
      layerTypes: [getLayerType(top)]
    });
  }
  
  // 方案2：双层（打底+外层）
  if (requiredLayers.length >= 2) {
    for (const base of baseLayers) {
      for (const outer of [...midLayers, ...outerLayers]) {
        // 避免选同一件
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
  }
  
  // 方案3：三层（打底+中间+外层）- 极寒天气
  if (requiredLayers.length >= 3 && targetWarmth > 12) {
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
  
  // 按分数排序
  return combinations.sort((a, b) => b.score - b.score);
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
  
  // 保暖匹配度
  const warmthDiff = Math.abs(totalWarmth - targetWarmth);
  let warmthScore = Math.max(0, 60 - warmthDiff * 4);
  
  // 刚好够暖有额外加分
  if (totalWarmth >= targetWarmth * 0.9 && totalWarmth <= targetWarmth * 1.15) {
    warmthScore += 15;
  }
  
  // 各层单独评分平均
  const layerScores = layers.map((layer, idx) => {
    const layerTarget = targetWarmth * [0.3, 0.4, 0.3][idx] || targetWarmth * 0.3;
    return scoreItem(layer, layerTarget, weather, scene, runType);
  });
  const avgLayerScore = layerScores.reduce((a, b) => a + b, 0) / layers.length;
  
  // 分层合理性加分
  let structureBonus = 0;
  if (layerTypes[0] === 'base') structureBonus += 5;
  if (layers.length >= 2 && (layerTypes[1] === 'mid' || layerTypes[1] === 'outer')) {
    structureBonus += 5;
  }
  
  return warmthScore + avgLayerScore + structureBonus;
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
  runType?: RunType
): OutfitRecommendation & { layeredTops?: ClothingItem[] } {
  // 计算需要的保暖值
  const effectiveTemp = calculateEffectiveTemp(weather, scene, runType);
  const neededWarmth = calculateTargetWarmth(weather, scene, runType);
  
  // 按部位分配目标保暖值
  const topTargetWarmth = neededWarmth * 0.6;
  const bottomTargetWarmth = neededWarmth * 0.3;
  const socksTargetWarmth = neededWarmth * 0.1;
  
  // 过滤适合场景的物品
  let filteredTops = wardrobe.tops.filter(item => isItemSuitableForScene(item, scene));
  let filteredBottoms = wardrobe.bottoms.filter(item => isItemSuitableForScene(item, scene));
  const filteredSocks = wardrobe.socks.filter(item => isItemSuitableForScene(item, scene));
  const filteredShoes = wardrobe.shoes.filter(item => isItemSuitableForScene(item, scene));
  const filteredHats = wardrobe.hats?.filter(item => isItemSuitableForScene(item, scene));
  
  // 应用强制规则
  const mandatoryTops = filteredTops.filter(item => 
    checkMandatoryRules(item, 'top', weather, scene, runType)
  );
  const mandatoryBottoms = filteredBottoms.filter(item => 
    checkMandatoryRules(item, 'bottom', weather, scene, runType)
  );
  
  // 如果有满足强制规则的，优先使用；否则回退
  const topsToUse = mandatoryTops.length > 0 ? mandatoryTops : filteredTops;
  const bottomsToUse = mandatoryBottoms.length > 0 ? mandatoryBottoms : filteredBottoms;
  
  // 如果过滤后为空，回退到全部
  const finalTops = topsToUse.length > 0 ? topsToUse : wardrobe.tops;
  const finalBottoms = bottomsToUse.length > 0 ? bottomsToUse : wardrobe.bottoms;
  const finalSocks = filteredSocks.length > 0 ? filteredSocks : wardrobe.socks;
  const finalShoes = filteredShoes.length > 0 ? filteredShoes : wardrobe.shoes;
  const finalHats = filteredHats && filteredHats.length > 0 ? filteredHats : wardrobe.hats;
  
  // 使用多层算法选择上衣
  const layeredTopOptions = generateTopLayers(finalTops, topTargetWarmth, weather, scene, runType);
  const bestTopCombination = layeredTopOptions[0];
  
  // 如果有多层，选择最外层作为主显示
  const mainTop = bestTopCombination.layers[bestTopCombination.layers.length - 1];
  
  // 其他部位评分排序
  const scoredBottoms = finalBottoms
    .map(item => ({ item, score: scoreItem(item, bottomTargetWarmth, weather, scene, runType) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredSocks = finalSocks
    .map(item => ({ item, score: scoreItem(item, socksTargetWarmth, weather, scene, runType) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredShoes = finalShoes
    .map(item => ({ item, score: scoreItem(item, 0, weather, scene, runType) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredHats = finalHats && finalHats.length > 0
    ? finalHats
        .map(item => ({ item, score: scoreHat(item, weather, effectiveTemp) }))
        .sort((a, b) => b.score - a.score)
    : [];
  
  // 选择各部位最佳
  const top = mainTop;
  const layeredTops = bestTopCombination.layers.length > 1 ? bestTopCombination.layers : undefined;
  const bottom = scoredBottoms[0]?.item;
  const socks = scoredSocks[0]?.item;
  const shoes = scoredShoes[0]?.item;
  
  // 极端天气才推荐帽子
  const shouldRecommendHat = effectiveTemp < 8 || effectiveTemp > 30 || weather.isRaining;
  const hat = shouldRecommendHat && scoredHats.length > 0 ? scoredHats[0].item : undefined;
  
  // 计算实际保暖值（包含多层上衣）
  const outfitWarmth = calculateOutfitWarmth({
    top: top!,
    bottom: bottom!,
    socks: socks!,
    shoes: shoes!,
    hat,
  }) + (layeredTops ? bestTopCombination.totalWarmth - getItemWarmthContribution(top!) : 0);
  
  // 生成提示和理由
  const weatherTips = generateWeatherTips(weather);
  const reasoning = generateReasoning(
    weather, 
    scene, 
    runType, 
    effectiveTemp, 
    outfitWarmth, 
    neededWarmth,
    bestTopCombination.layerTypes
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
    weatherTips,
    alternatives: {
      top: topAlternatives,
      bottom: scoredBottoms.slice(1, 4).map(s => s.item),
      socks: scoredSocks.slice(1, 4).map(s => s.item),
      shoes: scoredShoes.slice(1, 4).map(s => s.item),
      hat: scoredHats.slice(1, 4).map(s => s.item),
    },
    layeredTops, // 新增：多层上衣详情
  };
}
