// Clothing types
export type ClothingCategory = 'top' | 'bottom' | 'socks' | 'shoes' | 'hat';
export type ClothingSubCategory = 
  // 上衣
  | 't-shirt' | 'long-sleeve' | 'sweater' | 'hoodie' | 'jacket' | 'down-jacket' | 'windbreaker'
  | 'fleece' | 'cotton-padded' | 'wind-shirt' | 'shirt' | 'tank-top'
  // 下装
  | 'shorts' | 'half-tights' | 'pants'
  // 袜子
  | 'short-socks' | 'long-socks' | 'thick-socks'
  // 鞋子
  | 'hiking-shoes' | 'slippers' | 'casual-shoes' | 'running-shoes'
  // 帽子
  | 'summer-hat' | 'beanie' | 'running-hat';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subCategory: ClothingSubCategory;
  warmthLevel: number; // 1-10, 10 is warmest
  waterResistant: boolean;
  windResistant: boolean;
  usage: 'commute' | 'running' | 'both'; // 通勤、跑步、两者皆可
  hasPockets?: boolean; // 是否有口袋（用于长距离放能量胶）
  color?: string; // 可选，示例衣物可能没有
  imageUrl?: string;
  createdAt: string;
  isVirtual?: boolean; // 是否为示例/虚拟衣物
}

// Weather types
export interface WeatherData {
  temp: number; // Celsius
  feelsLike: number;
  humidity: number; // 0-100
  windSpeed: number; // m/s
  weatherCode: number; // OpenWeather code
  description: string;
  isRaining: boolean;
  rainLevel?: 'light' | 'moderate' | 'heavy';
  uvIndex?: number;
  cityName?: string; // 城市名称
}

// Outfit types
export type OutfitScene = 'commute' | 'running';
export type RunType = 'easy' | 'long' | 'interval'; // 有氧、长距离、间歇

export interface Outfit {
  id: string;
  top: ClothingItem;
  bottom: ClothingItem;
  socks: ClothingItem;
  shoes: ClothingItem;
  hat?: ClothingItem; // 帽子可选
  scene: OutfitScene;
  runType?: RunType; // 跑步类型
  weatherSnapshot?: WeatherData;
  note?: string;
  createdAt: string;
  rating?: number; // 1-5, user feedback
}

// Outfit History - 穿搭历史记录
export interface OutfitHistoryItem {
  id: string;
  items: {
    top: ClothingItem;
    layeredTops?: ClothingItem[]; // 多层上衣（内层+外层）
    bottom: ClothingItem;
    socks: ClothingItem;
    shoes: ClothingItem;
    hat?: ClothingItem;
    scene: OutfitScene;
    runType?: RunType;
    weatherSnapshot?: WeatherData;
  };
  weatherData: WeatherData; // 当时的天气数据
  locationName: string; // 地点
  scene: OutfitScene;
  runType?: RunType;
  wornAt: string; // 穿着时间
  createdAt: string;
  comfortRating?: number; // 舒适度评分 1-5
  notes?: string; // 用户备注
}

// User preferences - 大幅简化
export interface UserPreferences {
  id: string;
  location: string; // city name for default
  defaultRunType: RunType; // 默认跑步类型
}

// Legacy History entry (kept for compatibility)
export interface OutfitHistory {
  id: string;
  outfit: Outfit;
  actualTemp: number;
  comfortLevel: 'cold' | 'cool' | 'perfect' | 'warm' | 'hot';
  feedback?: string;
  createdAt: string;
}

// Reasoning data for i18n
export interface ReasoningData {
  layerCount?: number;
  layerTypes?: ('base' | 'mid' | 'outer')[];
  coverage?: number;
  scene: OutfitScene;
  runType?: RunType;
  targetTemp: number;
  isRaining: boolean;
  isExtremeHeat: boolean;
}

// Recommendation with reasoning
export interface OutfitRecommendation {
  outfit: {
    top: ClothingItem;
    bottom: ClothingItem;
    socks: ClothingItem;
    shoes: ClothingItem;
    hat?: ClothingItem;
    scene: OutfitScene;
    runType?: RunType;
    weatherSnapshot: WeatherData;
  };
  reasoning: string;
  reasoningData: ReasoningData; // 结构化的推荐理由数据，支持 i18n
  weatherTips: string[]; // 天气提示：风大、湿度大、下雨等
  alternatives?: {
    top?: ClothingItem[];
    bottom?: ClothingItem[];
    socks?: ClothingItem[];
    shoes?: ClothingItem[];
    hat?: ClothingItem[];
  };
  layeredTops?: ClothingItem[]; // 多层上衣（如打底+外套）
  hasVirtualItems?: boolean; // 是否包含示例/虚拟衣物
}
