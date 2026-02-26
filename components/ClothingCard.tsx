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
    <div className="glass-card p-4 relative group">
      <button
        onClick={onReplace}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <RefreshCw size={14} />
      </button>
      
      <div className="text-white/50 text-xs font-medium mb-3 uppercase tracking-wider">
        {label}
      </div>
      
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-14 h-14 rounded-xl object-cover bg-white/10"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl">
            {getCategoryEmoji(item.category)}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate text-base">{item.name}</div>
          <div className="text-white/50 text-sm">{getSubCategoryLabel(item.subCategory)}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-sm">
              {'🔥'.repeat(Math.max(1, Math.min(3, Math.ceil(item.warmthLevel / 3))))}
            </span>
            {item.waterResistant && <span className="text-xs bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded">防水</span>}
            {item.windResistant && <span className="text-xs bg-gray-500/30 text-gray-200 px-1.5 py-0.5 rounded">防风</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
