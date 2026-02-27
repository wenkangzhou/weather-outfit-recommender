import { 
  ClothingItem, 
  WeatherData, 
  OutfitRecommendation, 
  OutfitScene, 
  UserPreferences,
  RunType 
} from '@/types';

// Calculate effective temperature considering weather factors
function calculateEffectiveTemp(
  weather: WeatherData, 
  scene: OutfitScene,
  runType?: RunType
): number {
  let effectiveTemp = weather.feelsLike;
  
  // Humidity factor
  if (weather.humidity > 80) {
    if (effectiveTemp > 20) {
      effectiveTemp += 2; // muggy
    } else if (effectiveTemp < 10) {
      effectiveTemp -= 2; // damp cold
    }
  }
  
  // Running heat generation based on run type
  if (scene === 'running' && runType) {
    switch (runType) {
      case 'easy':
        // 有氧：心率低、出汗少，产热少，少减一点
        effectiveTemp -= 1;
        break;
      case 'long':
        // 长距离：配速稳定，中等产热
        effectiveTemp -= 3;
        break;
      case 'interval':
        // 间歇：速度快、产热多，多减一点
        effectiveTemp -= 4;
        break;
    }
  }
  
  return effectiveTemp;
}

// Get required warmth level based on temperature
function getRequiredWarmthLevel(temp: number): number {
  if (temp < -5) return 10;
  if (temp < 0) return 9;
  if (temp < 5) return 8;
  if (temp < 10) return 7;
  if (temp < 15) return 6;
  if (temp < 20) return 5;
  if (temp < 25) return 4;
  if (temp < 30) return 3;
  return 2;
}

// Filter and score items based on scene and run type
function scoreItem(
  item: ClothingItem, 
  targetWarmth: number, 
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType
): number {
  let score = 0;
  
  // Warmth match
  const warmthDiff = Math.abs(item.warmthLevel - targetWarmth);
  score += (10 - warmthDiff) * 10;
  
  // Weather bonuses
  if (weather.isRaining && item.waterResistant) {
    score += 20;
  }
  if (weather.windSpeed > 5 && item.windResistant) {
    score += 15;
  }
  
  // Run type specific scoring
  if (scene === 'running' && runType) {
    switch (runType) {
      case 'easy':
        // 有氧：可以适当保暖，不需要特殊装备
        break;
        
      case 'long':
        // 长距离：优先选择有口袋的裤子
        if (item.category === 'bottom' && item.hasPockets) {
          score += 25;
        }
        // 鞋子优先选跑鞋
        if (item.category === 'shoes' && item.subCategory === 'running-shoes') {
          score += 20;
        }
        break;
        
      case 'interval':
        // 间歇：优先选轻便、透气的
        if (item.warmthLevel <= 4) {
          score += 10; // 偏轻的装备
        }
        // 鞋子优先选跑鞋
        if (item.category === 'shoes' && item.subCategory === 'running-shoes') {
          score += 25;
        }
        break;
    }
  }
  
  // Commute scene
  if (scene === 'commute') {
    // 通勤选舒适、通用的
    if (item.category === 'shoes' && 
        (item.subCategory === 'casual-shoes' || item.subCategory === 'slippers')) {
      score += 15;
    }
  }
  
  return score;
}

// Score hat based on weather conditions
function scoreHat(
  item: ClothingItem,
  weather: WeatherData,
  effectiveTemp: number
): number {
  let score = 0;
  
  // Cold weather - warm hats preferred
  if (effectiveTemp < 5) {
    if (item.subCategory === 'beanie') score += 30;
    if (item.warmthLevel >= 7) score += 20;
  }
  
  // Hot weather - summer hats preferred
  if (effectiveTemp > 25) {
    if (item.subCategory === 'summer-hat') score += 30;
    if (item.warmthLevel <= 3) score += 20;
  }
  
  // Running scene - running hats preferred
  if (item.subCategory === 'running-hat') score += 15;
  
  // Sunny weather
  if (!weather.isRaining && weather.weatherCode >= 800) {
    if (item.subCategory === 'summer-hat' || item.subCategory === 'running-hat') score += 10;
  }
  
  return score;
}

// Generate weather tips for display
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

// Generate reasoning text
function generateReasoning(
  weather: WeatherData,
  scene: OutfitScene,
  runType?: RunType,
  effectiveTemp?: number,
  hasHat?: boolean
): string {
  const reasons: string[] = [];
  
  if (effectiveTemp !== undefined) {
    reasons.push(`体感约 ${Math.round(effectiveTemp)}°C`);
  }
  
  if (scene === 'running' && runType) {
    const runTypeLabels: Record<RunType, string> = {
      easy: '有氧跑，配速舒缓，注意保暖',
      long: '长距离，需携带补给，选有口袋的裤子',
      interval: '间歇跑，速度快产热多，跑后注意保暖',
    };
    reasons.push(runTypeLabels[runType]);
  }
  
  if (weather.isRaining) {
    reasons.push('雨天优先防水装备');
  }
  
  if (hasHat) {
    reasons.push('建议佩戴帽子');
  }
  
  return reasons.join(' · ');
}

// Main recommendation function
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
): OutfitRecommendation {
  const effectiveTemp = calculateEffectiveTemp(weather, scene, runType);
  const targetWarmth = getRequiredWarmthLevel(effectiveTemp);
  
  // Score and sort items
  const scoredTops = wardrobe.tops
    .map(item => ({ item, score: scoreItem(item, targetWarmth, weather, scene, runType) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredBottoms = wardrobe.bottoms
    .map(item => ({ item, score: scoreItem(item, targetWarmth * 0.7, weather, scene, runType) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredSocks = wardrobe.socks
    .map(item => ({ item, score: scoreItem(item, targetWarmth * 0.5, weather, scene, runType) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredShoes = wardrobe.shoes
    .map(item => ({ 
      item, 
      score: scoreItem(item, 0, weather, scene, runType)
    }))
    .sort((a, b) => b.score - a.score);
  
  // Score hats if available (optional)
  const scoredHats = wardrobe.hats && wardrobe.hats.length > 0
    ? wardrobe.hats
        .map(item => ({ item, score: scoreHat(item, weather, effectiveTemp) }))
        .sort((a, b) => b.score - a.score)
    : [];
  
  const top = scoredTops[0]?.item;
  const bottom = scoredBottoms[0]?.item;
  const socks = scoredSocks[0]?.item;
  const shoes = scoredShoes[0]?.item;
  
  // Only recommend hat if conditions warrant it
  const shouldRecommendHat = effectiveTemp < 10 || effectiveTemp > 28 || weather.isRaining;
  const hat = shouldRecommendHat && scoredHats.length > 0 ? scoredHats[0].item : undefined;
  
  // Generate weather tips
  const weatherTips = generateWeatherTips(weather);
  
  // Generate reasoning
  const reasoning = generateReasoning(weather, scene, runType, effectiveTemp, shouldRecommendHat);
  
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
      top: scoredTops.slice(1, 4).map(s => s.item),
      bottom: scoredBottoms.slice(1, 4).map(s => s.item),
      socks: scoredSocks.slice(1, 4).map(s => s.item),
      shoes: scoredShoes.slice(1, 4).map(s => s.item),
      hat: scoredHats.slice(1, 4).map(s => s.item),
    },
  };
}
