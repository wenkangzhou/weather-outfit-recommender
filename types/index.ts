// Clothing types
export type ClothingCategory = 'top' | 'bottom' | 'socks' | 'shoes';
export type ClothingSubCategory = 
  | 't-shirt' | 'long-sleeve' | 'sweater' | 'hoodie' | 'jacket' | 'down-jacket' | 'windbreaker'
  | 'shorts' | 'pants' | 'sweatpants' | 'thermal-pants'
  | 'short-socks' | 'long-socks' | 'thick-socks'
  | 'sneakers' | 'running-shoes' | 'casual-shoes' | 'boots';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subCategory: ClothingSubCategory;
  warmthLevel: number; // 1-10, 10 is warmest
  waterResistant: boolean;
  windResistant: boolean;
  color: string;
  hasPockets?: boolean; // 是否有口袋（用于长距离放能量胶）
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
  };
}
