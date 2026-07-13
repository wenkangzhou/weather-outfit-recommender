'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { X, Plus, ChevronLeft, Pencil, Trash2, ChevronDown, Search, Sparkles, ImagePlus } from 'lucide-react';
import { ClothingItem, ClothingCategory, ClothingSubCategory } from '@/types';
import {
  getClothingItems,
  addClothingItem,
  updateClothingItem,
  deleteClothingItem,
  uploadClothingImage,
  deleteClothingImage,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { QuickWardrobeBuilder, QuickWardrobeDraft } from '@/components/wardrobe/QuickWardrobeBuilder';
import { ClothingThumbnail } from '@/components/ClothingThumbnail';

const CATEGORIES: { type: ClothingCategory; label: string; icon: string; showWaterWind: boolean }[] = [
  { type: 'top', label: '上衣', icon: '👕', showWaterWind: true },
  { type: 'bottom', label: '下装', icon: '👖', showWaterWind: true },
  { type: 'socks', label: '袜子', icon: '🧦', showWaterWind: false },
  { type: 'shoes', label: '鞋子', icon: '👟', showWaterWind: true },
  { type: 'hat', label: '帽子', icon: '🧢', showWaterWind: true },
];

const SUB_CATEGORIES: Record<ClothingCategory, { type: ClothingSubCategory; label: string }[]> = {
  top: [
    { type: 't-shirt', label: 'T恤' },
    { type: 'long-sleeve', label: '长袖' },
    { type: 'sweater', label: '毛衣' },
    { type: 'hoodie', label: '卫衣' },
    { type: 'fleece', label: '抓绒' },
    { type: 'cotton-padded', label: '棉服' },
    { type: 'down-jacket', label: '羽绒服' },
    { type: 'jacket', label: '夹克' },
    { type: 'windbreaker', label: '冲锋衣' },
    { type: 'wind-shirt', label: '皮肤衣' },
    { type: 'shirt', label: '衬衫' },
    { type: 'tank-top', label: '背心' },
  ],
  bottom: [
    { type: 'shorts', label: '短裤' },
    { type: 'half-tights', label: '半弹' },
    { type: 'pants', label: '长裤' },
  ],
  socks: [
    { type: 'short-socks', label: '短袜' },
    { type: 'long-socks', label: '长袜' },
    { type: 'thick-socks', label: '厚袜' },
  ],
  shoes: [
    { type: 'hiking-shoes', label: '徒步鞋' },
    { type: 'slippers', label: '拖鞋' },
    { type: 'casual-shoes', label: '休闲鞋' },
    { type: 'running-shoes', label: '跑鞋' },
  ],
  hat: [
    { type: 'summer-hat', label: '夏帽' },
    { type: 'beanie', label: '冷帽' },
    { type: 'running-hat', label: '跑步帽' },
  ],
};

const USAGE_OPTIONS: { value: 'commute' | 'running' | 'both'; labelKey: string }[] = [
  { value: 'commute', labelKey: 'tags.commute' },
  { value: 'running', labelKey: 'tags.running' },
  { value: 'both', labelKey: 'tags.both' },
];

const DEFAULT_WARMTH: Record<ClothingSubCategory, number> = {
  't-shirt': 2,
  'long-sleeve': 3,
  sweater: 6,
  hoodie: 5,
  jacket: 5,
  'down-jacket': 9,
  windbreaker: 4,
  fleece: 6,
  'cotton-padded': 8,
  'wind-shirt': 2,
  shirt: 3,
  'tank-top': 1,
  shorts: 1,
  'half-tights': 2,
  pants: 3,
  'short-socks': 1,
  'long-socks': 2,
  'thick-socks': 4,
  'hiking-shoes': 2,
  slippers: 1,
  'casual-shoes': 1,
  'running-shoes': 1,
  'summer-hat': 1,
  beanie: 5,
  'running-hat': 1,
};

const POPULAR_BRANDS = [
  'Uniqlo', 'Nike', 'Adidas', 'Decathlon', 'Lululemon',
  'The North Face', "Arc'teryx", 'Salomon', 'HOKA', 'On',
];

const INITIAL_SHOW_COUNT = 4;

// Loading fallback for Suspense
function WardrobeLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pt-12 pb-4 px-5">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function WardrobePage() {
  return (
    <Suspense fallback={<WardrobeLoading />}>
      <WardrobeContent />
    </Suspense>
  );
}

function WardrobeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { t } = useTranslation();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClothingItem | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<ClothingCategory | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [usageFilter, setUsageFilter] = useState<'all' | 'commute' | 'running'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'warmth'>('recent');
  
  // 跟踪平台推荐的虚拟物品ID（数据库不支持 is_virtual 列，用本地状态）
  const [virtualItemIds, setVirtualItemIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('virtualItemIds');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  
  // 保存虚拟物品ID到 localStorage
  const saveVirtualItemIds = (ids: Set<string>) => {
    localStorage.setItem('virtualItemIds', JSON.stringify(Array.from(ids)));
    setVirtualItemIds(new Set(ids));
  };

  // 返回按钮处理：根据来源决定返回目标
  const handleBack = () => {
    if (from === 'settings') {
      // 返回到首页并自动切换到设置页
      router.push('/?tab=settings');
    } else {
      // 默认返回首页
      router.push('/');
    }
  };

  useEffect(() => {
    setMounted(true);
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await getClothingItems();
    setItems(data);
    setLoading(false);
  };

  const handleAddItem = async (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    await addClothingItem(item);
    await loadItems();
    setShowAddModal(false);
    setCopyingItem(null);
    setDefaultCategory(undefined);
  };
  
  // 用户只添加明确勾选、确认自己拥有的单品。
  const handleQuickAdd = async (selectedItems: QuickWardrobeDraft[]) => {
    await Promise.all(selectedItems.map(item => addClothingItem(item)));
    await loadItems();
    toast({
      title: t('wardrobe.quick.addedTitle'),
      description: t('wardrobe.quick.addedDescription', { count: selectedItems.length }),
    });
  };
  
  // 复制衣物 - 预填充数据并打开添加表单
  const [copyingItem, setCopyingItem] = useState<ClothingItem | null>(null);
  
  const handleCopyItem = (item: ClothingItem) => {
    setCopyingItem(item);
    setShowAddModal(true);
  };
  
  const handleUpdateItem = async (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => {
    await updateClothingItem(id, updates);
    // 编辑保存后从虚拟物品列表中移除（用户已确认这是真实衣物）
    const newVirtualIds = new Set(virtualItemIds);
    newVirtualIds.delete(id);
    saveVirtualItemIds(newVirtualIds);
    await loadItems();
    setEditingItem(null);
    setShowAddModal(false); // 关闭模态框回到衣柜列表
  };

  const handleDeleteItem = async (id: string) => {
    await deleteClothingItem(id);
    await loadItems();
    setDeletingItem(null);
  };

  const toggleCategory = (categoryType: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryType]: !prev[categoryType]
    }));
  };

  // 标记虚拟物品（根据本地存储的 virtualItemIds）
  const itemsWithVirtualFlag = useMemo(() => items.map(item => ({
    ...item,
    isVirtual: virtualItemIds.has(item.id),
  })), [items, virtualItemIds]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const nextItems = itemsWithVirtualFlag.filter(item => {
      const matchesSearch = !query || [
        item.name,
        item.brand,
        t(`types.${item.subCategory}`),
        CATEGORIES.find(category => category.type === item.category)?.label,
      ].some(value => value?.toLocaleLowerCase().includes(query));
      const matchesUsage = usageFilter === 'all'
        || item.usage === usageFilter
        || item.usage === 'both';
      return matchesSearch && matchesUsage;
    });

    return [...nextItems].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
      if (sortBy === 'warmth') return b.warmthLevel - a.warmthLevel;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [itemsWithVirtualFlag, searchQuery, sortBy, t, usageFilter]);
  
  const groupedItems = {
    top: filteredItems.filter(i => i.category === 'top'),
    bottom: filteredItems.filter(i => i.category === 'bottom'),
    socks: filteredItems.filter(i => i.category === 'socks'),
    shoes: filteredItems.filter(i => i.category === 'shoes'),
    hat: filteredItems.filter(i => i.category === 'hat'),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header - 刘海屏适配 */}
        <header className="safe-area-header pb-4 px-5 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">{t('settings.myWardrobe')}</h1>
        </header>

        {mounted && !loading && items.length > 0 && (
          <div className="px-5 pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder={t('wardrobe.searchPlaceholder')}
                aria-label={t('wardrobe.searchPlaceholder')}
                className="w-full rounded-xl border border-border bg-muted/50 py-3 pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'commute', 'running'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setUsageFilter(filter)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    usageFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`wardrobe.filter.${filter}`)}
                </button>
              ))}
              <select
                value={sortBy}
                onChange={event => setSortBy(event.target.value as typeof sortBy)}
                aria-label={t('wardrobe.sort.label')}
                className="ml-auto rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="recent">{t('wardrobe.sort.recent')}</option>
                <option value="name">{t('wardrobe.sort.name')}</option>
                <option value="warmth">{t('wardrobe.sort.warmth')}</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('wardrobe.resultCount', { count: filteredItems.length, total: items.length })}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-8">
          {!mounted || loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-4xl">
                👕
              </div>
              <p className="text-muted-foreground mb-6">{t('outfit.emptyWardrobe')}</p>
              
              <QuickWardrobeBuilder
                onAddItems={handleQuickAdd}
                onManualAdd={(category) => {
                  setEditingItem(null);
                  setDefaultCategory(category);
                  setShowAddModal(true);
                }}
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <Search size={32} className="mb-3 text-muted-foreground" />
              <p className="font-medium">{t('wardrobe.noResults')}</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setUsageFilter('all');
                }}
                className="mt-4 rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t('wardrobe.clearFilters')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 分类列表 */}
              <div className="space-y-4">
                {CATEGORIES.filter(cat => groupedItems[cat.type].length > 0).map(cat => (
                  <CategorySection
                    key={cat.type}
                    category={cat}
                    items={groupedItems[cat.type]}
                    isExpanded={expandedCategories[cat.type] || false}
                    onToggle={() => toggleCategory(cat.type)}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setShowAddModal(true);
                    }}
                    onDelete={setDeletingItem}
                    onCopy={handleCopyItem}
                    onAdd={() => {
                      setEditingItem(null);
                      setDefaultCategory(cat.type);
                      setShowAddModal(true);
                    }}
                    t={t}
                  />
                ))}
              </div>
              

            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <AddEditItemModal 
          item={editingItem}
          copyingItem={copyingItem}
          defaultCategory={defaultCategory}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
            setCopyingItem(null);
            setDefaultCategory(undefined);
          }}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={() => handleDeleteItem(deletingItem.id)}
        />
      )}
      
      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <QuickAddModal
          onClose={() => setShowQuickAddModal(false)}
          onAddItems={handleQuickAdd}
          onManualAdd={(category) => {
            setEditingItem(null);
            setDefaultCategory(category);
            setShowAddModal(true);
            setShowQuickAddModal(false);
          }}
        />
      )}
      
      {/* 悬浮快速添加按钮（非空衣柜时显示） */}
      {items.length > 0 && (
        <button
          onClick={() => setShowQuickAddModal(true)}
          className="fixed right-5 bottom-24 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-40"
          aria-label="快速添加"
        >
          <Plus size={24} />
        </button>
      )}
    </main>
  );
}

// 分类区块组件
function CategorySection({
  category,
  items,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onCopy,
  onAdd,
  t,
}: {
  category: typeof CATEGORIES[0];
  items: ClothingItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onCopy: (item: ClothingItem) => void;
  onAdd: () => void;
  t: any;
}) {
  const showCount = isExpanded ? items.length : INITIAL_SHOW_COUNT;
  const displayedItems = items.slice(0, showCount);
  const hasMore = items.length > INITIAL_SHOW_COUNT;
  
  // 跟踪当前显示操作按钮的 item ID
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  // 处理展开/收起，同时清除 active 状态
  const handleToggle = () => {
    setActiveItemId(null);
    onToggle();
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <span className="font-medium">{category.label}</span>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-8 px-2">
          <Plus size={16} className="mr-1" />
          添加
        </Button>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <div className="divide-y divide-border/50">
          {displayedItems.map((item) => {
            const isActive = activeItemId === item.id;
            return (
              <div
                key={item.id}
                className="relative p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setActiveItemId(isActive ? null : item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveItemId(isActive ? null : item.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isActive}
                aria-label={`${item.name}，展开操作`}
              >
                {/* 右上角删除按钮 - 与编辑/复制同步显示 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  title="删除"
                  aria-label={`删除 ${item.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>

                {/* Real photo when available, category icon otherwise. */}
                <ClothingThumbnail
                  imageUrl={item.imageUrl}
                  name={item.name}
                  fallbackIcon={category.icon}
                />

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    {item.brand && (
                      <span className="max-w-20 truncate rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.brand}
                      </span>
                    )}
                    <div className="font-medium truncate max-w-[200px]">{item.name}</div>
                    {/* 保暖值 - 算法核心参数 */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      item.warmthLevel <= 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      item.warmthLevel <= 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      保暖{item.warmthLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                    <span className="text-xs text-muted-foreground shrink-0">{t(`types.${item.subCategory}`)}</span>
                    
                    {/* Tags */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {item.usage === 'running' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded font-medium">
                          跑步
                        </span>
                      )}
                      {item.usage === 'commute' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded font-medium">
                          通勤
                        </span>
                      )}
                      {item.usage === 'both' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-violet-400 to-purple-400 text-white rounded font-medium">
                          皆可
                        </span>
                      )}
                      {category.showWaterWind && item.waterResistant && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded font-medium">
                          防水
                        </span>
                      )}
                      {category.showWaterWind && item.windResistant && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded font-medium">
                          防风
                        </span>
                      )}
                      {item.hasPockets && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-indigo-400 to-blue-500 text-white rounded font-medium">
                          口袋
                        </span>
                      )}
                      {item.isVirtual && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded font-medium">
                          {t('virtual.platformRecommended')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions - 编辑+复制图标，删除在右上角 */}
                <div 
                  className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => onEdit(item)}
                    title="编辑"
                    aria-label={`编辑 ${item.name}`}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-blue-600 hover:text-blue-700"
                    onClick={() => onCopy(item)}
                    title="复制"
                    aria-label={`复制 ${item.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground text-sm">
          暂无{category.label}，点击上方添加
        </div>
      )}

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={handleToggle}
          className="w-full py-3 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {isExpanded ? (
            <>
              收起 <ChevronDown size={16} className="rotate-180" />
            </>
          ) : (
            <>
              还有 {items.length - INITIAL_SHOW_COUNT} 件 <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </Card>
  );
}

// Add/Edit Item Modal
function AddEditItemModal({ 
  item,
  copyingItem,
  defaultCategory,
  onClose, 
  onAdd,
  onUpdate,
}: { 
  item: ClothingItem | null;
  copyingItem?: ClothingItem | null;
  defaultCategory?: ClothingCategory;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const isEditing = !!item;
  const isCopying = !!copyingItem;
  const selectedCategory = item?.category || copyingItem?.category || defaultCategory;
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [subCategory, setSubCategory] = useState<ClothingSubCategory | null>(null);
  const [warmthLevel, setWarmthLevel] = useState(5);
  const [waterResistant, setWaterResistant] = useState(false);
  const [windResistant, setWindResistant] = useState(false);
  const [hasPockets, setHasPockets] = useState(false);
  const [usage, setUsage] = useState<'commute' | 'running' | 'both'>('both');
  const [nameIsCustom, setNameIsCustom] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);
  
  // 客户端挂载后再初始化表单值，避免 SSR/客户端不一致
  useEffect(() => {
    setMounted(true);
    const sourceItem = item || copyingItem;
    if (sourceItem) {
      // 编辑模式或复制模式：预填充数据
      setName(sourceItem.name + (isCopying ? ' (副本)' : ''));
      setBrand(sourceItem.brand || '');
      setSubCategory(sourceItem.subCategory || null);
      setWarmthLevel(sourceItem.warmthLevel || 5);
      setWaterResistant(sourceItem.waterResistant || false);
      setWindResistant(sourceItem.windResistant || false);
      setHasPockets(sourceItem.hasPockets || false);
      setUsage(sourceItem.usage || 'both');
      setNameIsCustom(true);
    } else {
      // 新增模式：清空表单
      setName('');
      setBrand('');
      setSubCategory(null);
      setWarmthLevel(5);
      setWaterResistant(false);
      setWindResistant(false);
      setHasPockets(false);
      setUsage('both');
      setNameIsCustom(false);
    }
    // A copied item should get its own optional photo instead of reusing the
    // original item's storage object.
    setImageFile(null);
    setImagePreview(item?.imageUrl || '');
    setImageRemoved(false);
    setShowAdvanced(false);
  }, [item, copyingItem, isCopying]);

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const autoNameFor = (nextBrand: string, nextSubCategory: ClothingSubCategory | null) => {
    if (!selectedCategory || !nextSubCategory) return '';
    const typeLabel = SUB_CATEGORIES[selectedCategory].find(option => option.type === nextSubCategory)?.label || '';
    return [nextBrand.trim(), typeLabel].filter(Boolean).join(' ');
  };

  const handleSubCategoryChange = (nextSubCategory: ClothingSubCategory) => {
    setSubCategory(nextSubCategory);
    setWarmthLevel(DEFAULT_WARMTH[nextSubCategory]);
    if (!nameIsCustom) setName(autoNameFor(brand, nextSubCategory));
  };

  const handleBrandChange = (nextBrand: string) => {
    setBrand(nextBrand);
    if (!nameIsCustom) setName(autoNameFor(nextBrand, subCategory));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast({
        title: t('wardrobe.editor.photoInvalidTitle'),
        description: t('wardrobe.editor.photoInvalidDescription'),
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageRemoved(true);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !subCategory || !name.trim()) return;
    
    setSaving(true);
    let newImagePath: string | undefined;
    try {
      const uploadedImage = imageFile ? await uploadClothingImage(imageFile) : undefined;
      newImagePath = uploadedImage?.imagePath;
      const data = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        category: selectedCategory,
        subCategory,
        warmthLevel,
        waterResistant: selectedCategory !== 'socks' ? waterResistant : false,
        windResistant: selectedCategory !== 'socks' ? windResistant : false,
        usage,
        hasPockets: selectedCategory === 'bottom' ? hasPockets : false,
        color: '#000000',
        imagePath: imageRemoved ? '' : uploadedImage?.imagePath ?? item?.imagePath,
        imageUrl: imageRemoved ? '' : uploadedImage?.imageUrl ?? item?.imageUrl,
      };

      if (isEditing && item) {
        await onUpdate(item.id, data);
      } else {
        await onAdd(data);
      }

      if (item?.imagePath && (imageRemoved || uploadedImage)) {
        await deleteClothingImage(item.imagePath);
      }
    } catch (error) {
      if (newImagePath) await deleteClothingImage(newImagePath);
      console.error('save wardrobe item error:', error);
      toast({
        title: t('wardrobe.editor.saveFailed'),
        description: t('wardrobe.editor.saveFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const showWaterWind = selectedCategory !== 'socks';
  const categoryInfo = CATEGORIES.find(c => c.type === selectedCategory);

  // 避免 SSR/客户端渲染不一致，未挂载时显示 loading
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wardrobe-editor-title"
    >
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Modal Header */}
        <header className="pt-8 pb-4 px-5 flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={20} />
          </Button>
          <h1 id="wardrobe-editor-title" className="text-lg font-semibold">
            {isEditing ? '编辑衣物' : isCopying ? '复制衣物' : `添加${categoryInfo?.label || '衣物'}`}
          </h1>
        </header>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {!isEditing && !isCopying && (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t('wardrobe.editor.fastTitle')}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('wardrobe.editor.fastDescription')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Category Display */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">分类</label>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <span className="text-2xl">{categoryInfo?.icon}</span>
                <span className="font-medium">{categoryInfo?.label}</span>
              </div>
            </div>

            {/* Sub Category */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">类型</label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory && SUB_CATEGORIES[selectedCategory].map(sub => (
                  <button
                    key={sub.type}
                    type="button"
                    onClick={() => handleSubCategoryChange(sub.type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      subCategory === sub.type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand is optional and can be completed later. */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="wardrobe-brand" className="text-sm font-medium text-muted-foreground">
                  {t('wardrobe.editor.brand')}
                </label>
                <span className="text-xs text-muted-foreground">{t('wardrobe.editor.optional')}</span>
              </div>
              <input
                id="wardrobe-brand"
                type="text"
                list="wardrobe-brand-options"
                value={brand}
                onChange={event => handleBrandChange(event.target.value)}
                placeholder={t('wardrobe.editor.brandPlaceholder')}
                className="input-field"
              />
              <datalist id="wardrobe-brand-options">
                {POPULAR_BRANDS.map(option => <option key={option} value={option} />)}
              </datalist>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {POPULAR_BRANDS.slice(0, 6).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleBrandChange(brand === option ? '' : option)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                      brand === option
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="wardrobe-item-name" className="text-sm font-medium text-muted-foreground">{t('wardrobe.editor.name')}</label>
                <span className="text-xs text-muted-foreground">{t('wardrobe.editor.autoGenerated')}</span>
              </div>
              <input
                id="wardrobe-item-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameIsCustom(event.target.value.trim().length > 0);
                }}
                placeholder={t('wardrobe.editor.namePlaceholder')}
                className="input-field"
              />
            </div>

            {/* Photo stays optional: users can add clothes first and enrich them later. */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('wardrobe.editor.photo')}
                </label>
                <span className="text-xs text-muted-foreground">{t('wardrobe.editor.optional')}</span>
              </div>
              <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                <ClothingThumbnail
                  imageUrl={imagePreview}
                  name={t('wardrobe.editor.photoPreview')}
                  fallbackIcon="📷"
                  className="h-24 w-24"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t('wardrobe.editor.photoHint')}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="wardrobe-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                    <label
                      htmlFor="wardrobe-photo"
                      className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <ImagePlus size={14} className="mr-1.5" aria-hidden="true" />
                      {t(imagePreview ? 'wardrobe.editor.changePhoto' : 'wardrobe.editor.addPhoto')}
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive"
                      >
                        {t('wardrobe.editor.removePhoto')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                aria-expanded={showAdvanced}
                onClick={() => setShowAdvanced(current => !current)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary">
                  <Sparkles size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{t('wardrobe.editor.advanced')}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t('wardrobe.editor.estimatedSummary', {
                      warmth: warmthLevel,
                      usage: t(USAGE_OPTIONS.find(option => option.value === usage)?.labelKey || 'tags.both'),
                    })}
                  </span>
                </span>
                <ChevronDown size={18} className={`text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-5 border-t border-border p-4 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('wardrobe.editor.usage')}</label>
                    <div className="flex gap-2">
                      {USAGE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setUsage(opt.value)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            usage === opt.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t('wardrobe.editor.warmth')} <span className="text-primary font-bold ml-1">{warmthLevel}</span>
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setWarmthLevel(level)}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                            warmthLevel >= level
                              ? 'bg-orange-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{t('wardrobe.editor.lightweight')}</span>
                      <span>{t('wardrobe.editor.warm')}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {showWaterWind && (
                      <>
                        <ToggleRow label={t('clothing.waterproof')} checked={waterResistant} onChange={setWaterResistant} />
                        <ToggleRow label={t('clothing.windproof')} checked={windResistant} onChange={setWindResistant} />
                      </>
                    )}
                    {selectedCategory === 'bottom' && (
                      <ToggleRow label={t('wardrobe.editor.pockets')} checked={hasPockets} onChange={setHasPockets} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border shrink-0">
          <Button 
            className="w-full h-12 text-base"
            disabled={!subCategory || !name.trim() || saving}
            onClick={handleSubmit}
          >
            {saving ? t('wardrobe.editor.saving') : isEditing ? t('wardrobe.editor.save') : t('wardrobe.editor.add')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ 
  item, 
  onClose, 
  onConfirm 
}: { 
  item: ClothingItem;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 size={24} className="text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">确认删除?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            确定要删除 &ldquo;{item.name}&rdquo; 吗? 此操作无法撤销。
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              取消
            </Button>
            <Button variant="destructive" className="flex-1" onClick={onConfirm}>
              删除
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl"
    >
      <span className="font-medium">{label}</span>
      <div className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </button>
  );
}

// 快速添加模态框：与空衣柜共用“勾选我拥有的单品”流程。
function QuickAddModal({
  onClose,
  onAddItems,
  onManualAdd,
}: {
  onClose: () => void;
  onAddItems: (items: QuickWardrobeDraft[]) => Promise<void>;
  onManualAdd: (category: ClothingCategory) => void;
}) {
  const { t } = useTranslation();

  const handleAddItems = async (items: QuickWardrobeDraft[]) => {
    await onAddItems(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl animate-fade-in">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <header className="safe-area-header flex items-center justify-between px-5 pb-4">
          <div>
            <h2 className="text-xl font-semibold">{t('wardrobe.quick.modalTitle')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('wardrobe.quick.modalDescription')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('wardrobe.quick.close')}>
            <X size={20} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <QuickWardrobeBuilder onAddItems={handleAddItems} onManualAdd={onManualAdd} />
        </div>
      </div>
    </div>
  );
}
