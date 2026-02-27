'use client';

import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { ClothingItem } from '@/types';

interface ClothingCardProps {
  item: ClothingItem;
  label: string;
  onReplace: () => void;
}

export default function ClothingCard({ item, label, onReplace }: ClothingCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 relative group border border-white/10 hover:bg-white/15 transition-colors">
      {/* 替换按钮 */}
      <button
        onClick={onReplace}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <RefreshCw size={12} />
      </button>
      
      {/* 标签 */}
      <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
        {label}
      </div>
      
      {/* 内容 */}
      <div className="flex items-center gap-2">
        <div className="text-2xl">
          {item.category === 'top' ? '👕' : 
           item.category === 'bottom' ? '👖' : 
           item.category === 'socks' ? '🧦' : '👟'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.name}</div>
          <div className="text-xs opacity-50">{t(`types.${item.subCategory}`)}</div>
        </div>
      </div>
      
      {/* 属性标签 */}
      <div className="flex gap-1 mt-2">
        {item.waterResistant && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
            {t('clothing.waterproof')}
          </span>
        )}
        {item.windResistant && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-300">
            {t('clothing.windproof')}
          </span>
        )}
      </div>
    </div>
  );
}
