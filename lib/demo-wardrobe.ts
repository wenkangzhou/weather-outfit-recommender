// 示例衣物库 - 用于新用户冷启动时的虚拟推荐
// 这些衣物会标记为 isVirtual，用户可选择添加到真实衣柜

import { ClothingItem } from '@/types';

// 示例上衣（内层+中层+外层）
export const demoTops: ClothingItem[] = [
  // 内层
  {
    id: 'demo_top_001',
    name: '速干短袖T恤',
    category: 'top',
    subCategory: 't-shirt',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_002',
    name: '美利奴羊毛长袖',
    category: 'top',
    subCategory: 'long-sleeve',
    warmthLevel: 3,
    waterResistant: false,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_003',
    name: '纯棉长袖T恤',
    category: 'top',
    subCategory: 'long-sleeve',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  // 中层
  {
    id: 'demo_top_004',
    name: '抓绒衣',
    category: 'top',
    subCategory: 'fleece',
    warmthLevel: 3,
    waterResistant: false,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_005',
    name: '羽绒内胆',
    category: 'top',
    subCategory: 'cotton-padded',
    warmthLevel: 4,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_006',
    name: '轻量卫衣',
    category: 'top',
    subCategory: 'hoodie',
    warmthLevel: 5,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  // 外层
  {
    id: 'demo_top_007',
    name: '冲锋衣（硬壳）',
    category: 'top',
    subCategory: 'windbreaker',
    warmthLevel: 3,
    waterResistant: true,
    windResistant: true,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_008',
    name: '羽绒服',
    category: 'top',
    subCategory: 'down-jacket',
    warmthLevel: 7,
    waterResistant: false,
    windResistant: true,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_009',
    name: '防风软壳',
    category: 'top',
    subCategory: 'wind-shirt',
    warmthLevel: 4,
    waterResistant: false,
    windResistant: true,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_top_010',
    name: '皮肤衣',
    category: 'top',
    subCategory: 'jacket',
    warmthLevel: 1,
    waterResistant: false,
    windResistant: true,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
];

// 示例下装
export const demoBottoms: ClothingItem[] = [
  {
    id: 'demo_bottom_001',
    name: '短裤',
    category: 'bottom',
    subCategory: 'shorts',
    warmthLevel: 1,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_bottom_002',
    name: '跑步半弹（半弹紧身短裤）',
    category: 'bottom',
    subCategory: 'half-tights',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_bottom_003',
    name: '运动长裤',
    category: 'bottom',
    subCategory: 'pants',
    warmthLevel: 4,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_bottom_004',
    name: '加绒运动裤',
    category: 'bottom',
    subCategory: 'pants',
    warmthLevel: 6,
    waterResistant: false,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_bottom_005',
    name: '休闲牛仔裤',
    category: 'bottom',
    subCategory: 'pants',
    warmthLevel: 4,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_bottom_006',
    name: '软壳裤',
    category: 'bottom',
    subCategory: 'pants',
    warmthLevel: 5,
    waterResistant: true,
    windResistant: true,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
];

// 示例袜子
export const demoSocks: ClothingItem[] = [
  {
    id: 'demo_socks_001',
    name: '薄款跑步袜',
    category: 'socks',
    subCategory: 'short-socks',
    warmthLevel: 1,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_socks_002',
    name: '中筒运动袜',
    category: 'socks',
    subCategory: 'long-socks',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_socks_003',
    name: '加厚保暖袜',
    category: 'socks',
    subCategory: 'thick-socks',
    warmthLevel: 5,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_socks_004',
    name: '美丽诺羊毛袜',
    category: 'socks',
    subCategory: 'thick-socks',
    warmthLevel: 4,
    waterResistant: false,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
];

// 示例鞋子
export const demoShoes: ClothingItem[] = [
  {
    id: 'demo_shoes_001',
    name: '竞速跑鞋',
    category: 'shoes',
    subCategory: 'running-shoes',
    warmthLevel: 1,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_shoes_002',
    name: '缓震跑鞋',
    category: 'shoes',
    subCategory: 'running-shoes',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_shoes_003',
    name: '休闲运动鞋',
    category: 'shoes',
    subCategory: 'casual-shoes',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_shoes_004',
    name: '防水徒步鞋',
    category: 'shoes',
    subCategory: 'hiking-shoes',
    warmthLevel: 3,
    waterResistant: true,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_shoes_005',
    name: '板鞋',
    category: 'shoes',
    subCategory: 'casual-shoes',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'commute',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
];

// 示例帽子
export const demoHats: ClothingItem[] = [
  {
    id: 'demo_hat_001',
    name: '空顶帽',
    category: 'hat',
    subCategory: 'running-hat',
    warmthLevel: 1,
    waterResistant: false,
    windResistant: false,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_hat_002',
    name: '棒球帽',
    category: 'hat',
    subCategory: 'summer-hat',
    warmthLevel: 2,
    waterResistant: false,
    windResistant: false,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_hat_003',
    name: '保暖抓绒帽',
    category: 'hat',
    subCategory: 'beanie',
    warmthLevel: 5,
    waterResistant: false,
    windResistant: true,
    usage: 'both',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo_hat_004',
    name: '防风跑步帽',
    category: 'hat',
    subCategory: 'running-hat',
    warmthLevel: 3,
    waterResistant: false,
    windResistant: true,
    usage: 'running',
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
];

// 完整的示例衣柜
export const demoWardrobe = {
  tops: demoTops,
  bottoms: demoBottoms,
  socks: demoSocks,
  shoes: demoShoes,
  hats: demoHats,
};

// 根据天气和场景获取推荐的示例衣物
export function getRecommendedDemoItems(
  category: 'tops' | 'bottoms' | 'socks' | 'shoes' | 'hats',
  weather: { feelsLike: number; isRaining: boolean },
  scene: 'commute' | 'running',
  limit: number = 3
): ClothingItem[] {
  const items = demoWardrobe[category];
  
  // 筛选适合场景的
  let filtered = items.filter(item => 
    item.usage === scene || item.usage === 'both'
  );
  
  // 根据天气进一步筛选
  if (weather.isRaining) {
    // 雨天优先防水
    const waterResistant = filtered.filter(i => i.waterResistant);
    if (waterResistant.length > 0) filtered = waterResistant;
  }
  
  if (weather.feelsLike < 10) {
    // 冷天优先保暖
    filtered = filtered.filter(i => i.warmthLevel >= 4);
  } else if (weather.feelsLike > 25) {
    // 热天优先轻薄
    filtered = filtered.filter(i => i.warmthLevel <= 2);
  }
  
  // 返回前N个
  return filtered.slice(0, limit);
}
