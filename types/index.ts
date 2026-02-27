// Clothing types
export type ClothingCategory = 'top' | 'bottom' | 'socks' | 'shoes' | 'hat';
export type ClothingSubCategory = 
  // 上衣
  | 't-shirt' | 'long-sleeve' | 'sweater' | 'hoodie' | 'jacket' | 'down-jacket' | 'windbreaker'
  | 'fleece' | 'cotton-padded' | 'wind-shirt' | 'shirt'
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
  color: string;
  imageUrl?: string;
  createdAt: string;
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
  weatherSnapshot: WeatherData;
  note?: string;
  createdAt: string;
  rating?: number; // 1-5, user feedback
}

// User preferences - 大幅简化
export interface UserPreferences {
  id: string;
  location: string; // city name for default
  defaultRunType: RunType; // 默认跑步类型
}

// History entry
export interface OutfitHistory {
  id: string;
  outfit: Outfit;
  actualTemp: number;
  comfortLevel: 'cold' | 'cool' | 'perfect' | 'warm' | 'hot';
  feedback?: string;
  createdAt: string;
}

// Recommendation with reasoning
export interface OutfitRecommendation {
  outfit: Omit<Outfit, 'id' | 'createdAt'>;
  reasoning: string;
  weatherTips: string[]; // 天气提示：风大、湿度大、下雨等
  alternatives?: {
    top?: ClothingItem[];
    bottom?: ClothingItem[];
    socks?: ClothingItem[];
    shoes?: ClothingItem[];
    hat?: ClothingItem[];
  };
}
