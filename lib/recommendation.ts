import { ClothingItem, WeatherData, OutfitRecommendation, OutfitScene, UserPreferences } from '@/types';

// Season transition detection
function getSeasonTransition(temp: number, month: number): 'winter-to-spring' | 'summer-to-fall' | 'normal' {
  // Winter to Spring: Feb-Mar, temp rising from cold to mild
  if ((month === 2 || month === 3) && temp >= 5 && temp <= 15) {
    return 'winter-to-spring';
  }
  // Summer to Fall: Sep-Oct, temp dropping from warm to cool
  if ((month === 9 || month === 10) && temp >= 10 && temp <= 20) {
    return 'summer-to-fall';
  }
  return 'normal';
}

// Calculate effective temperature considering multiple factors
function calculateEffectiveTemp(
  weather: WeatherData, 
  preferences: UserPreferences,
  scene: OutfitScene
): number {
  let effectiveTemp = weather.feelsLike;
  
  // Humidity factor: high humidity makes it feel hotter in warm weather
  // and colder in cold weather (damp cold)
  if (weather.humidity > 80) {
    if (effectiveTemp > 20) {
      effectiveTemp += 2; // muggy
    } else if (effectiveTemp < 10) {
      effectiveTemp -= 2; // damp cold
    }
  }
  
  // Wind chill effect
  if (weather.windSpeed > 5 && preferences.windSensitivity) {
    effectiveTemp -= Math.min(3, weather.windSpeed / 3);
  }
  
  // Season transition adjustment
  const month = new Date().getMonth() + 1;
  const transition = getSeasonTransition(weather.temp, month);
  
  if (transition === 'winter-to-spring') {
    // People tend to dress lighter too early in spring
    effectiveTemp -= 1;
  } else if (transition === 'summer-to-fall') {
    // People tend to overdress in early fall
    effectiveTemp += 1;
  }
  
  // Personal cold/hot sensitivity
  if (preferences.coldSensitivity > 3) {
    effectiveTemp -= preferences.coldSensitivity - 3;
  }
  if (preferences.hotSensitivity > 3) {
    effectiveTemp += preferences.hotSensitivity - 3;
  }
  
  // Scene adjustment: running generates heat
  if (scene === 'running') {
    const activityHeat = preferences.sweatLevel === 'high' ? 5 : 
                         preferences.sweatLevel === 'medium' ? 3 : 2;
    effectiveTemp -= activityHeat;
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

// Filter items by weather conditions
function filterByWeather(items: ClothingItem[], weather: WeatherData): ClothingItem[] {
  return items.filter(item => {
    // If raining, prefer water resistant items
    if (weather.isRaining && !item.waterResistant) {
      // Allow non-water resistant but with lower priority
      if (item.category === 'shoes' || item.category === 'socks') {
        return false;
      }
    }
    
    // If windy, prefer wind resistant outer layers
    if (weather.windSpeed > 5 && !item.windResistant) {
      // Still allow but lower priority
    }
    
    return true;
  });
}

// Score items for a given temperature
function scoreItem(item: ClothingItem, targetWarmth: number, weather: WeatherData): number {
  let score = 0;
  
  // Warmth match (closer to target is better)
  const warmthDiff = Math.abs(item.warmthLevel - targetWarmth);
  score += (10 - warmthDiff) * 10;
  
  // Weather bonuses
  if (weather.isRaining && item.waterResistant) {
    score += 20;
  }
  if (weather.windSpeed > 5 && item.windResistant) {
    score += 15;
  }
  
  // Running preference: lighter for running
  // This is handled at the scene level
  
  return score;
}

// Main recommendation function
export function generateRecommendation(
  wardrobe: {
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    socks: ClothingItem[];
    shoes: ClothingItem[];
  },
  weather: WeatherData,
  preferences: UserPreferences,
  scene: OutfitScene
): OutfitRecommendation {
  const effectiveTemp = calculateEffectiveTemp(weather, preferences, scene);
  const targetWarmth = getRequiredWarmthLevel(effectiveTemp);
  
  // Filter and score items
  const scoredTops = filterByWeather(wardrobe.tops, weather)
    .map(item => ({ item, score: scoreItem(item, targetWarmth, weather) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredBottoms = filterByWeather(wardrobe.bottoms, weather)
    .map(item => ({ item, score: scoreItem(item, targetWarmth * 0.7, weather) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredSocks = filterByWeather(wardrobe.socks, weather)
    .map(item => ({ item, score: scoreItem(item, targetWarmth * 0.5, weather) }))
    .sort((a, b) => b.score - a.score);
  
  const scoredShoes = filterByWeather(wardrobe.shoes, weather)
    .map(item => ({ 
      item, 
      score: scoreItem(item, 0, weather) + 
             (scene === 'running' && item.subCategory === 'running-shoes' ? 50 : 0) +
             (weather.isRaining && item.waterResistant ? 30 : 0)
    }))
    .sort((a, b) => b.score - a.score);
  
  const top = scoredTops[0]?.item;
  const bottom = scoredBottoms[0]?.item;
  const socks = scoredSocks[0]?.item;
  const shoes = scoredShoes[0]?.item;
  
  // Generate reasoning
  const reasons: string[] = [];
  reasons.push(`当前体感温度约 ${Math.round(effectiveTemp)}°C`);
  
  if (weather.isRaining) {
    reasons.push('有雨，优先选择防水材质');
  }
  if (weather.windSpeed > 5) {
    reasons.push('风较大，注意防风');
  }
  if (weather.humidity > 80) {
    reasons.push('湿度高，注意透气');
  }
  
  const month = new Date().getMonth() + 1;
  const transition = getSeasonTransition(weather.temp, month);
  if (transition === 'winter-to-spring') {
    reasons.push('换季时节，适当保暖');
  } else if (transition === 'summer-to-fall') {
    reasons.push('换季时节，注意早晚温差');
  }
  
  if (scene === 'running') {
    reasons.push('跑步场景，已考虑运动产热');
  }
  
  return {
    outfit: {
      top: top!,
      bottom: bottom!,
      socks: socks!,
      shoes: shoes!,
      scene,
      weatherSnapshot: weather,
    },
    reasoning: reasons.join('；'),
    alternatives: {
      top: scoredTops.slice(1, 4).map(s => s.item),
      bottom: scoredBottoms.slice(1, 4).map(s => s.item),
      socks: scoredSocks.slice(1, 4).map(s => s.item),
      shoes: scoredShoes.slice(1, 4).map(s => s.item),
    },
  };
}
