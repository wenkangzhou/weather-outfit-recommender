import { WeatherData } from '@/types';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

// Weather code mapping
const weatherCodeMap: Record<number, { description: string; isRain: boolean }> = {
  200: { description: '雷雨', isRain: true },
  201: { description: '雷雨', isRain: true },
  202: { description: '雷雨', isRain: true },
  210: { description: '雷雨', isRain: true },
  211: { description: '雷雨', isRain: true },
  212: { description: '重雷雨', isRain: true },
  221: { description: '雷雨', isRain: true },
  230: { description: '雷雨', isRain: true },
  231: { description: '雷雨', isRain: true },
  232: { description: '雷雨', isRain: true },
  300: { description: '小雨', isRain: true },
  301: { description: '雨', isRain: true },
  302: { description: '雨', isRain: true },
  310: { description: '小雨', isRain: true },
  311: { description: '雨', isRain: true },
  312: { description: '雨', isRain: true },
  313: { description: '雨', isRain: true },
  314: { description: '雨', isRain: true },
  321: { description: '雨', isRain: true },
  500: { description: '小雨', isRain: true },
  501: { description: '中雨', isRain: true },
  502: { description: '大雨', isRain: true },
  503: { description: '暴雨', isRain: true },
  504: { description: '大暴雨', isRain: true },
  511: { description: '冻雨', isRain: true },
  520: { description: '阵雨', isRain: true },
  521: { description: '阵雨', isRain: true },
  522: { description: '暴雨', isRain: true },
  531: { description: '阵雨', isRain: true },
  600: { description: '小雪', isRain: false },
  601: { description: '雪', isRain: false },
  602: { description: '大雪', isRain: false },
  611: { description: '雨夹雪', isRain: true },
  612: { description: '雨夹雪', isRain: true },
  613: { description: '雨夹雪', isRain: true },
  615: { description: '雨夹雪', isRain: true },
  616: { description: '雨夹雪', isRain: true },
  620: { description: '阵雪', isRain: false },
  621: { description: '阵雪', isRain: false },
  622: { description: '暴雪', isRain: false },
  701: { description: '雾', isRain: false },
  711: { description: '烟', isRain: false },
  721: { description: '霾', isRain: false },
  731: { description: '沙尘', isRain: false },
  741: { description: '雾', isRain: false },
  751: { description: '沙尘', isRain: false },
  761: { description: '尘', isRain: false },
  762: { description: '火山灰', isRain: false },
  771: { description: '阵风', isRain: false },
  781: { description: '龙卷风', isRain: false },
  800: { description: '晴', isRain: false },
  801: { description: '少云', isRain: false },
  802: { description: '多云', isRain: false },
  803: { description: '多云', isRain: false },
  804: { description: '阴', isRain: false },
};

export async function getCurrentWeather(city: string): Promise<WeatherData> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  const weatherCode = data.weather[0]?.id || 800;
  const weatherInfo = weatherCodeMap[weatherCode] || { description: '未知', isRain: false };
  
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    weatherCode,
    description: weatherInfo.description,
    isRaining: weatherInfo.isRain,
    uvIndex: data.uvi,
  };
}

// Mock weather for development
export function getMockWeather(): WeatherData {
  return {
    temp: 15,
    feelsLike: 13,
    humidity: 65,
    windSpeed: 3.5,
    weatherCode: 802,
    description: '多云',
    isRaining: false,
    uvIndex: 3,
  };
}
