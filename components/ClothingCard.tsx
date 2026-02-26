'use client';

import { RefreshCw } from 'lucide-react';
import { ClothingItem } from '@/types';

interface ClothingCardProps {
  item: ClothingItem;
  label: string;
  onReplace: () => void;
}

export default function ClothingCard({ item, label, onReplace }: ClothingCardProps) {
  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      top: '👕',
      bottom: '👖',
      socks: '🧦',
      shoes: '👟',
    };
    return emojis[category] || '👔';
  };

  const getSubCategoryLabel = (sub: string) => {
    const labels: Record<string, string> = {
      't-shirt': 'T恤',
      'long-sleeve': '长袖',
      'sweater': '毛衣',
      'hoodie': '卫衣',
      'jacket': '夹克',
      'down-jacket': '羽绒服',
      'windbreaker': '冲锋衣',
      'shorts': '短裤',
      'pants': '长裤',
      'sweatpants': '运动裤',
      'thermal-pants': '保暖裤',
      'short-socks': '短袜',
      'long-socks': '长袜',
      'thick-socks': '厚袜',
      'sneakers': '运动鞋',
      'running-shoes': '跑鞋',
      'casual-shoes': '休闲鞋',
      'boots': '靴子',
    };
    return labels[sub] || sub;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <button
          onClick={onReplace}
          className="text-gray-400 hover:text-primary-600 transition-colors"
          title="替换"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-14 h-14 rounded-lg object-cover bg-gray-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
            {getCategoryEmoji(item.category)}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-500">{getSubCategoryLabel(item.subCategory)}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs">{'🔥'.repeat(Math.max(1, Math.min(5, Math.ceil(item.warmthLevel / 2))))}</span>
            {item.waterResistant && <span className="text-xs">💧</span>}
            {item.windResistant && <span className="text-xs">🌬️</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
