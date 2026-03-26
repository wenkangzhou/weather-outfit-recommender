'use client';

import { ClothingItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface ClothingCardProps {
  item?: ClothingItem;
  label: string;
  icon: string;
  onReplace?: () => void;
  onDelete?: () => void; // 删除/取消选择
  showAdd?: boolean;
  onAdd?: () => void;
  labelBadgeColor?: string; // 标签颜色类名
  deletable?: boolean; // 是否可删除（用于帽子等可选物品）
  onAddToWardrobe?: () => void; // 添加虚拟衣物到衣柜
}

export default function ClothingCard({ 
  item, 
  label, 
  icon,
  onReplace, 
  onDelete,
  showAdd = false,
  onAdd,
  labelBadgeColor,
  deletable = false,
  onAddToWardrobe
}: ClothingCardProps) {
  const { t } = useTranslation();
  
  // 添加模式
  if (showAdd) {
    return (
      <div 
        className="flex items-center gap-4 p-4 bg-card border border-dashed border-border rounded-xl hover:border-border hover:bg-accent/50 transition-all cursor-pointer min-h-[72px]"
        onClick={onAdd}
      >
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-muted-foreground">{t('common.add')}{label}</span>
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
    <div className={`relative flex items-center gap-4 p-4 border rounded-xl transition-all min-h-[72px] ${
      item.isVirtual 
        ? 'bg-slate-50 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-700' 
        : 'bg-card border-border hover:border-border/80'
    }`}>
      {/* 删除按钮 - 与更换/添加按钮放在同一行，而不是绝对定位 */}
      {/* 移到按钮区域统一处理 */}

      {/* Icon */}
      <span className="text-2xl shrink-0">{icon}</span>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Label Badge + Name row */}
        <div className="flex items-center gap-2">
          {/* 层级标签 */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${labelBadgeColor || 'bg-primary/10 text-primary'}`}>
            {label}
          </span>
          {/* Name */}
          <div className="font-medium text-base truncate">
            {item.name}
          </div>
        </div>
        
        {/* Second row: SubCategory + Tags */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* 子分类 */}
          <span className="text-xs text-muted-foreground">
            {t(`types.${item.subCategory}`)}
          </span>
          
          {/* 虚拟衣物标识 */}
          {item.isVirtual && (
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded font-medium">
              {t('virtual.platformRecommended')}
            </span>
          )}
          
          {/* 标签 */}
          {item.usage === 'running' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">{t('tags.running')}</span>
          )}
          {item.usage === 'commute' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">{t('tags.commute')}</span>
          )}
          {item.usage === 'both' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded">{t('tags.both')}</span>
          )}
          {item.waterResistant && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">{t('tags.water')}</span>
          )}
          {item.windResistant && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">{t('tags.wind')}</span>
          )}
          {item.hasPockets && (
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">{t('tags.pocket')}</span>
          )}
        </div>
      </div>

      {/* 按钮区域 */}
      <div className="flex items-center gap-2 shrink-0">
        {item.isVirtual ? (
          // 虚拟衣物：添加到衣柜按钮（橙色主题）
          onAddToWardrobe && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToWardrobe();
              }}
              className="px-3 py-1.5 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 rounded-lg transition-colors font-medium"
            >
              {t('virtual.addToWardrobe')}
            </button>
          )
        ) : (
          // 真实衣物：更换按钮
          onReplace && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReplace();
              }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              {t('outfit.change')}
            </button>
          )
        )}
        
        {/* 删除按钮 - 与更换按钮并排显示（如帽子） */}
        {deletable && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium"
            title="删除"
          >
            删除
          </button>
        )}
      </div>
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
