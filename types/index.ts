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
  uvIndex?: number;
  cityName?: string; // 城市名称
}

// Outfit types
export type OutfitScene = 'commute' | 'running';

export interface Outfit {
  id: string;
  top: ClothingItem;
  bottom: ClothingItem;
  socks: ClothingItem;
  shoes: ClothingItem;
  scene: OutfitScene;
  weatherSnapshot: WeatherData;
  note?: string;
  createdAt: string;
  rating?: number; // 1-5, user feedback
}

// User preferences
export interface UserPreferences {
  id: string;
  location: string; // city name
  commuteDistance: number; // km
  runDistance: number; // km
  coldSensitivity: number; // 1-5, higher means more sensitive to cold
  hotSensitivity: number; // 1-5, higher means more sensitive to heat
  sweatLevel: 'low' | 'medium' | 'high';
  windSensitivity: boolean;
  rainPreference: 'avoid' | 'ok' | 'like';
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
  alternatives?: {
    top?: ClothingItem[];
    bottom?: ClothingItem[];
    socks?: ClothingItem[];
    shoes?: ClothingItem[];
  };
}
