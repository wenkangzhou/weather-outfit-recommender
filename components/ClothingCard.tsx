'use client';

import { ClothingItem } from '@/types';

interface ClothingCardProps {
  item?: ClothingItem;
  label: string;
  icon: string;
  onReplace?: () => void;
  showAdd?: boolean;
  onAdd?: () => void;
}

export default function ClothingCard({ 
  item, 
  label, 
  icon,
  onReplace, 
  showAdd = false,
  onAdd
}: ClothingCardProps) {
  // 添加模式
  if (showAdd) {
    return (
      <div 
        className="flex items-center gap-4 p-4 bg-card border border-dashed border-border rounded-xl hover:border-border hover:bg-accent/50 transition-all cursor-pointer min-h-[72px]"
        onClick={onAdd}
      >
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-muted-foreground">添加{label}</span>
      </div>
    );
  }

  // 如果没有 item
  if (!item) {
    return (
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl opacity-50 min-h-[72px]">
        <span className="text-2xl opacity-40">{icon}</span>
        <span className="text-sm text-muted-foreground">暂无{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border/80 transition-all min-h-[72px]">
      {/* Icon */}
      <span className="text-2xl shrink-0">{icon}</span>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name - 独占一行 */}
        <div className="font-medium text-base truncate">
          {item.name}
        </div>
        
        {/* Second row: SubCategory + Tags */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {/* 子分类 */}
          <span className="text-xs text-muted-foreground">
            {getSubCategoryLabel(item.subCategory)}
          </span>
          
          {/* 分隔符 */}
          <span className="text-muted-foreground/30">·</span>
          
          {/* 标签 */}
          {item.usage === 'running' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">跑步</span>
          )}
          {item.usage === 'commute' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">通勤</span>
          )}
          {item.usage === 'both' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded">皆可</span>
          )}
          {item.waterResistant && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">防水</span>
          )}
          {item.windResistant && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">防风</span>
          )}
          {item.hasPockets && (
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">口袋</span>
          )}
        </div>
      </div>

      {/* Replace Button */}
      {onReplace && (
        <button
          onClick={onReplace}
          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors shrink-0"
        >
          更换
        </button>
      )}
    </div>
  );
}

function getSubCategoryLabel(subCategory: string): string {
  const labels: Record<string, string> = {
    't-shirt': 'T恤',
    'long-sleeve': '长袖',
    'sweater': '毛衣',
    'hoodie': '卫衣',
    'fleece': '抓绒',
    'cotton-padded': '棉服',
    'down-jacket': '羽绒服',
    'jacket': '夹克',
    'windbreaker': '冲锋衣',
    'wind-shirt': '皮肤衣',
    'shirt': '衬衫',
    'tank-top': '背心',
    'shorts': '短裤',
    'half-tights': '半弹',
    'pants': '长裤',
    'short-socks': '短袜',
    'long-socks': '长袜',
    'thick-socks': '厚袜',
    'hiking-shoes': '徒步鞋',
    'slippers': '拖鞋',
    'casual-shoes': '休闲鞋',
    'running-shoes': '跑鞋',
    'summer-hat': '夏帽',
    'beanie': '冷帽',
    'running-hat': '跑步帽',
  };
  return labels[subCategory] || subCategory;
}
