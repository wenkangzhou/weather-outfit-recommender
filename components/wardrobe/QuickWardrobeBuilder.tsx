'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronRight, Footprints, Layers3, Plus, Shirt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClothingCategory, ClothingItem } from '@/types';
import { Button } from '@/components/ui/button';

export type QuickWardrobeDraft = Omit<ClothingItem, 'id' | 'createdAt'>;

interface CatalogItem {
  id: string;
  nameZh: string;
  nameEn: string;
  item: Omit<QuickWardrobeDraft, 'name'>;
}

const CATALOG: CatalogItem[] = [
  { id: 'basic-tee', nameZh: '基础短袖', nameEn: 'Basic T-shirt', item: { category: 'top', subCategory: 't-shirt', warmthLevel: 2, waterResistant: false, windResistant: false, usage: 'commute', color: '#d1d5db' } },
  { id: 'running-tee', nameZh: '速干短袖', nameEn: 'Quick-dry T-shirt', item: { category: 'top', subCategory: 't-shirt', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', color: '#60a5fa' } },
  { id: 'base-layer', nameZh: '长袖打底', nameEn: 'Long-sleeve base layer', item: { category: 'top', subCategory: 'long-sleeve', warmthLevel: 3, waterResistant: false, windResistant: false, usage: 'both', color: '#94a3b8' } },
  { id: 'hoodie', nameZh: '卫衣', nameEn: 'Hoodie', item: { category: 'top', subCategory: 'hoodie', warmthLevel: 5, waterResistant: false, windResistant: false, usage: 'commute', color: '#64748b' } },
  { id: 'fleece', nameZh: '抓绒衣', nameEn: 'Fleece', item: { category: 'top', subCategory: 'fleece', warmthLevel: 6, waterResistant: false, windResistant: false, usage: 'both', color: '#0f766e' } },
  { id: 'wind-shell', nameZh: '轻薄防风衣', nameEn: 'Light wind shell', item: { category: 'top', subCategory: 'wind-shirt', warmthLevel: 2, waterResistant: true, windResistant: true, usage: 'running', color: '#06b6d4' } },
  { id: 'down-jacket', nameZh: '羽绒服', nameEn: 'Down jacket', item: { category: 'top', subCategory: 'down-jacket', warmthLevel: 9, waterResistant: true, windResistant: true, usage: 'commute', color: '#1f2937' } },
  { id: 'running-shorts', nameZh: '运动短裤', nameEn: 'Running shorts', item: { category: 'bottom', subCategory: 'shorts', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', hasPockets: true, color: '#111827' } },
  { id: 'half-tights', nameZh: '半弹紧身裤', nameEn: 'Half tights', item: { category: 'bottom', subCategory: 'half-tights', warmthLevel: 2, waterResistant: false, windResistant: false, usage: 'running', hasPockets: true, color: '#1f2937' } },
  { id: 'everyday-pants', nameZh: '日常长裤', nameEn: 'Everyday pants', item: { category: 'bottom', subCategory: 'pants', warmthLevel: 3, waterResistant: false, windResistant: false, usage: 'commute', hasPockets: true, color: '#475569' } },
  { id: 'running-socks', nameZh: '跑步短袜', nameEn: 'Running socks', item: { category: 'socks', subCategory: 'short-socks', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', color: '#f8fafc' } },
  { id: 'thick-socks', nameZh: '厚袜', nameEn: 'Thick socks', item: { category: 'socks', subCategory: 'thick-socks', warmthLevel: 4, waterResistant: false, windResistant: false, usage: 'both', color: '#a16207' } },
  { id: 'running-shoes', nameZh: '跑鞋', nameEn: 'Running shoes', item: { category: 'shoes', subCategory: 'running-shoes', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', color: '#f97316' } },
  { id: 'casual-shoes', nameZh: '休闲鞋', nameEn: 'Casual shoes', item: { category: 'shoes', subCategory: 'casual-shoes', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'commute', color: '#334155' } },
  { id: 'running-cap', nameZh: '跑步帽', nameEn: 'Running cap', item: { category: 'hat', subCategory: 'running-hat', warmthLevel: 1, waterResistant: true, windResistant: false, usage: 'running', color: '#2563eb' } },
  { id: 'beanie', nameZh: '冷帽', nameEn: 'Beanie', item: { category: 'hat', subCategory: 'beanie', warmthLevel: 5, waterResistant: false, windResistant: true, usage: 'both', color: '#78350f' } },
];

const FILTERS: Array<{ value: 'all' | ClothingCategory; labelKey: string }> = [
  { value: 'all', labelKey: 'wardrobe.quick.all' },
  { value: 'top', labelKey: 'clothing.top' },
  { value: 'bottom', labelKey: 'clothing.bottom' },
  { value: 'socks', labelKey: 'clothing.socks' },
  { value: 'shoes', labelKey: 'clothing.shoes' },
  { value: 'hat', labelKey: 'clothing.hat' },
];

const CATEGORY_META = {
  top: { icon: Shirt, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' },
  bottom: { icon: Layers3, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
  socks: { icon: Footprints, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  shoes: { icon: Footprints, tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' },
  hat: { icon: Layers3, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
} satisfies Record<ClothingCategory, { icon: typeof Shirt; tone: string }>;

export function QuickWardrobeBuilder({
  onAddItems,
  onManualAdd,
}: {
  onAddItems: (items: QuickWardrobeDraft[]) => Promise<void>;
  onManualAdd: (category: ClothingCategory) => void;
}) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'all' | ClothingCategory>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const visibleItems = useMemo(
    () => filter === 'all' ? CATALOG : CATALOG.filter(entry => entry.item.category === filter),
    [filter],
  );

  const toggleItem = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0 || adding) return;
    setAdding(true);
    const english = i18n.language.startsWith('en');
    const items = CATALOG
      .filter(entry => selectedIds.has(entry.id))
      .map(entry => ({
        ...entry.item,
        name: english ? entry.nameEn : entry.nameZh,
      }));
    try {
      await onAddItems(items);
      setSelectedIds(new Set());
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Check size={18} />
          </div>
          <div>
            <h3 className="font-semibold">{t('wardrobe.quick.title')}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{t('wardrobe.quick.description')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label={t('wardrobe.quick.filterLabel')}>
        {FILTERS.map(option => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              filter === option.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleItems.map(entry => {
          const selected = selectedIds.has(entry.id);
          const meta = CATEGORY_META[entry.item.category];
          const Icon = meta.icon;
          const displayName = i18n.language.startsWith('en') ? entry.nameEn : entry.nameZh;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleItem(entry.id)}
              className={`relative min-h-28 rounded-2xl border p-3 text-left transition-all ${
                selected
                  ? 'border-primary bg-primary/8 ring-2 ring-primary/15'
                  : 'border-border bg-card hover:border-primary/35 hover:bg-accent/30'
              }`}
            >
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${meta.tone}`}>
                <Icon size={20} />
              </span>
              <span className="block text-sm font-semibold leading-tight">{displayName}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {t(`wardrobe.quick.usage.${entry.item.usage}`)}
              </span>
              <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-transparent'
              }`}>
                <Check size={14} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <Button
          className="h-12 w-full text-base"
          disabled={selectedIds.size === 0 || adding}
          onClick={handleAdd}
        >
          {adding
            ? t('wardrobe.quick.adding')
            : t('wardrobe.quick.addSelected', { count: selectedIds.size })}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">{t('wardrobe.quick.onlySelected')}</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">{t('wardrobe.quick.manualTitle')}</p>
        <div className="grid grid-cols-2 gap-2">
          {FILTERS.filter(option => option.value !== 'all').map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => onManualAdd(option.value as ClothingCategory)}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium hover:border-primary/35 hover:bg-accent/30"
            >
              <span className="flex items-center gap-2">
                <Plus size={15} className="text-muted-foreground" />
                {t(option.labelKey)}
              </span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
