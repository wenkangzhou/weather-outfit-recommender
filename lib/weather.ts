import { WeatherData } from '@/types';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

// 天气代码映射
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

// 中文城市名映射为英文名
const cityMapping: Record<string, string> = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '杭州': 'Hangzhou',
  '南京': 'Nanjing',
  '成都': 'Chengdu',
  '武汉': 'Wuhan',
  '西安': 'Xian',
  '重庆': 'Chongqing',
  '天津': 'Tianjin',
  '苏州': 'Suzhou',
  '青岛': 'Qingdao',
  '厦门': 'Xiamen',
  '大连': 'Dalian',
  '宁波': 'Ningbo',
  '无锡': 'Wuxi',
  '佛山': 'Foshan',
  '东莞': 'Dongguan',
  '郑州': 'Zhengzhou',
  '长沙': 'Changsha',
  '沈阳': 'Shenyang',
  '济南': 'Jinan',
  '哈尔滨': 'Harbin',
  '长春': 'Changchun',
  '石家庄': 'Shijiazhuang',
  '太原': 'Taiyuan',
  '合肥': 'Hefei',
  '南昌': 'Nanchang',
  '昆明': 'Kunming',
  '贵阳': 'Guiyang',
  '南宁': 'Nanning',
  '兰州': 'Lanzhou',
  '海口': 'Haikou',
  '乌鲁木齐': 'Urumqi',
  '银川': 'Yinchuan',
  '西宁': 'Xining',
  '拉萨': 'Lhasa',
  '呼和浩特': 'Hohhot',
  '台北': 'Taipei',
  '香港': 'Hong Kong',
  '澳门': 'Macao',
  '杨浦': 'Shanghai',
  '浦东': 'Shanghai',
};

// 获取用户地理位置 - 带错误处理
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Server side'));
      return;
    }
    
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        console.warn('Geolocation error:', error.message);
        reject(error);
      },
      { 
        enableHighAccuracy: false, // 降低精度要求，提高成功率
        timeout: 8000, 
        maximumAge: 600000 
      }
    );
  });
}

// 使用经纬度获取天气
export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch weather data');
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
    cityName: data.name,
  };
}

// 使用城市名获取天气
export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const cityEn = cityMapping[city] || city;
  
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityEn)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'City not found');
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
    cityName: data.name,
  };
}

// 主函数：获取天气，失败自动降级
export async function getCurrentWeather(preferredCity?: string): Promise<WeatherData> {
  // 1. 优先使用用户设置的城市
  if (preferredCity) {
    try {
      console.log('Using preferred city:', preferredCity);
      return await getWeatherByCity(preferredCity);
    } catch (error) {
      console.warn('Failed to get weather for preferred city:', error);
    }
  }
  
  // 2. 尝试获取地理位置
  try {
    console.log('Trying geolocation...');
    const position = await getCurrentPosition();
    console.log('Geolocation success:', position.coords.latitude, position.coords.longitude);
    return await getWeatherByCoords(position.coords.latitude, position.coords.longitude);
  } catch (error) {
    console.warn('Geolocation failed:', error);
  }
  
  // 3. 最终降级到默认城市（上海）
  console.log('Falling back to default city: Shanghai');
  return await getWeatherByCity('Shanghai');
}

// Mock 天气数据
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
    cityName: '上海',
  };
}
