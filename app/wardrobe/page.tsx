'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { X, Plus, ChevronLeft, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { ClothingItem, ClothingCategory, ClothingSubCategory } from '@/types';
import { getClothingItems, addClothingItem, updateClothingItem, deleteClothingItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/components/I18nProvider';

const CATEGORIES: { type: ClothingCategory; label: string; icon: string; showWaterWind: boolean }[] = [
  { type: 'top', label: '上衣', icon: '👕', showWaterWind: true },
  { type: 'bottom', label: '下装', icon: '👖', showWaterWind: true },
  { type: 'socks', label: '袜子', icon: '🧦', showWaterWind: false },
  { type: 'shoes', label: '鞋子', icon: '👟', showWaterWind: true },
  { type: 'hat', label: '帽子', icon: '🧢', showWaterWind: true },
];

// 快速添加模板 - 预设常用套装
interface QuickTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: Omit<ClothingItem, 'id' | 'createdAt'>[];
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'runner_basic',
    name: '跑步基础套装',
    icon: '🏃',
    description: '夏季跑步三件套',
    items: [
      { name: '速干短袖T恤', category: 'top', subCategory: 't-shirt', warmthLevel: 2, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#3b82f6' },
      { name: '运动短裤', category: 'bottom', subCategory: 'shorts', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', hasPockets: true, color: '#1f2937' },
      { name: '跑步袜', category: 'socks', subCategory: 'short-socks', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#ffffff' },
      { name: '跑鞋', category: 'shoes', subCategory: 'running-shoes', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#f97316' },
    ],
  },
  {
    id: 'commute_basic',
    name: '通勤基础套装',
    icon: '🚶',
    description: '日常通勤四件套',
    items: [
      { name: '纯棉长袖T恤', category: 'top', subCategory: 'long-sleeve', warmthLevel: 3, waterResistant: false, windResistant: false, usage: 'commute', hasPockets: false, color: '#e5e7eb' },
      { name: '休闲长裤', category: 'bottom', subCategory: 'pants', warmthLevel: 2, waterResistant: false, windResistant: false, usage: 'commute', hasPockets: true, color: '#374151' },
      { name: '棉袜', category: 'socks', subCategory: 'long-socks', warmthLevel: 2, waterResistant: false, windResistant: false, usage: 'commute', hasPockets: false, color: '#9ca3af' },
      { name: '休闲鞋', category: 'shoes', subCategory: 'casual-shoes', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'commute', hasPockets: false, color: '#4b5563' },
    ],
  },
  {
    id: 'winter_runner',
    name: '冬季跑步套装',
    icon: '❄️',
    description: '保暖跑步五件套',
    items: [
      { name: '速干打底长袖', category: 'top', subCategory: 'long-sleeve', warmthLevel: 3, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#1e40af' },
      { name: '抓绒保暖层', category: 'top', subCategory: 'fleece', warmthLevel: 5, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#065f46' },
      { name: '运动长裤', category: 'bottom', subCategory: 'pants', warmthLevel: 3, waterResistant: false, windResistant: false, usage: 'running', hasPockets: true, color: '#111827' },
      { name: '厚羊毛袜', category: 'socks', subCategory: 'thick-socks', warmthLevel: 4, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#78350f' },
      { name: '跑鞋', category: 'shoes', subCategory: 'running-shoes', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', hasPockets: false, color: '#dc2626' },
    ],
  },
  {
    id: 'rainy_day',
    name: '雨天跑步套装',
    icon: '🌧️',
    description: '防雨跑步三件套',
    items: [
      { name: '皮肤衣', category: 'top', subCategory: 'wind-shirt', warmthLevel: 2, waterResistant: true, windResistant: true, usage: 'running', hasPockets: false, color: '#06b6d4' },
      { name: '运动短裤', category: 'bottom', subCategory: 'shorts', warmthLevel: 1, waterResistant: false, windResistant: false, usage: 'running', hasPockets: true, color: '#1f2937' },
      { name: '跑鞋', category: 'shoes', subCategory: 'running-shoes', warmthLevel: 1, waterResistant: true, windResistant: false, usage: 'running', hasPockets: false, color: '#2563eb' },
    ],
  },
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

const USAGE_OPTIONS: { value: 'commute' | 'running' | 'both'; label: string }[] = [
  { value: 'commute', label: '通勤' },
  { value: 'running', label: '跑步' },
  { value: 'both', label: '两者皆可' },
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
    <ThemeProvider>
      <I18nProvider>
        <Suspense fallback={<WardrobeLoading />}>
          <WardrobeContent />
        </Suspense>
      </I18nProvider>
    </ThemeProvider>
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
  };
  
  // 快速添加模板（批量添加）
  const handleQuickAdd = async (template: QuickTemplate) => {
    // 依次添加模板中的物品
    for (const item of template.items) {
      await addClothingItem(item);
    }
    await loadItems();
  };
  
  // 复制衣物 - 预填充数据并打开添加表单
  const [copyingItem, setCopyingItem] = useState<ClothingItem | null>(null);
  
  const handleCopyItem = (item: ClothingItem) => {
    setCopyingItem(item);
    setShowAddModal(true);
  };
  
  const handleCopySubmit = async (item: Omit<ClothingItem, 'id' | 'createdAt'>) => {
    await addClothingItem(item);
    await loadItems();
    setShowAddModal(false);
    setCopyingItem(null);
    toast({ title: '复制成功', description: `已添加 ${item.name}` });
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
  const itemsWithVirtualFlag = items.map(item => ({
    ...item,
    isVirtual: virtualItemIds.has(item.id)
  }));
  
  const groupedItems = {
    top: itemsWithVirtualFlag.filter(i => i.category === 'top'),
    bottom: itemsWithVirtualFlag.filter(i => i.category === 'bottom'),
    socks: itemsWithVirtualFlag.filter(i => i.category === 'socks'),
    shoes: itemsWithVirtualFlag.filter(i => i.category === 'shoes'),
    hat: itemsWithVirtualFlag.filter(i => i.category === 'hat'),
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
              
              {/* 快速添加模板 */}
              <QuickAddTemplates 
                onAddTemplate={handleQuickAdd}
                onAddSingle={(category) => {
                  setEditingItem(null);
                  setDefaultCategory(category || 'top');
                  setShowAddModal(true);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 分类列表 */}
              <div className="space-y-4">
                {CATEGORIES.map(cat => (
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
          onAddTemplate={handleQuickAdd}
          onAddSingle={(category) => {
            setEditingItem(null);
            setDefaultCategory(category || 'top');
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
          {displayedItems.map((item, index) => {
            const isActive = activeItemId === item.id;
            return (
              <div
                key={item.id}
                className="relative p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setActiveItemId(isActive ? null : item.id)}
              >
                {/* 右上角删除按钮 - 与编辑/复制同步显示 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  title="删除"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>

                {/* Index Number */}
                <span className="text-xs text-muted-foreground w-5">{index + 1}</span>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
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
                          平台推荐
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
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-blue-600 hover:text-blue-700"
                    onClick={() => onCopy(item)}
                    title="复制"
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
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const isEditing = !!item;
  const isCopying = !!copyingItem;
  const selectedCategory = item?.category || copyingItem?.category || defaultCategory;
  
  const [name, setName] = useState('');
  const [subCategory, setSubCategory] = useState<ClothingSubCategory | null>(null);
  const [warmthLevel, setWarmthLevel] = useState(5);
  const [waterResistant, setWaterResistant] = useState(false);
  const [windResistant, setWindResistant] = useState(false);
  const [hasPockets, setHasPockets] = useState(false);
  const [usage, setUsage] = useState<'commute' | 'running' | 'both'>('both');
  
  // 客户端挂载后再初始化表单值，避免 SSR/客户端不一致
  useEffect(() => {
    setMounted(true);
    const sourceItem = item || copyingItem;
    if (sourceItem) {
      // 编辑模式或复制模式：预填充数据
      setName(sourceItem.name + (isCopying ? ' (副本)' : ''));
      setSubCategory(sourceItem.subCategory || null);
      setWarmthLevel(sourceItem.warmthLevel || 5);
      setWaterResistant(sourceItem.waterResistant || false);
      setWindResistant(sourceItem.windResistant || false);
      setHasPockets(sourceItem.hasPockets || false);
      setUsage(sourceItem.usage || 'both');
    } else {
      // 新增模式：清空表单
      setName('');
      setSubCategory(null);
      setWarmthLevel(5);
      setWaterResistant(false);
      setWindResistant(false);
      setHasPockets(false);
      setUsage('both');
    }
  }, [item, copyingItem, isCopying]);

  const handleSubmit = () => {
    if (!selectedCategory || !subCategory || !name.trim()) return;
    
    const data = {
      name: name.trim(),
      category: selectedCategory,
      subCategory,
      warmthLevel,
      waterResistant: selectedCategory !== 'socks' ? waterResistant : false,
      windResistant: selectedCategory !== 'socks' ? windResistant : false,
      usage,
      hasPockets: selectedCategory === 'bottom' ? hasPockets : false,
      color: '#000000',
    };

    if (isEditing && item) {
      onUpdate(item.id, data);
    } else {
      onAdd(data);
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
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Modal Header */}
        <header className="pt-8 pb-4 px-5 flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={20} />
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditing ? '编辑衣物' : isCopying ? '复制衣物' : `添加${categoryInfo?.label || '衣物'}`}
          </h1>
        </header>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
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
                    onClick={() => setSubCategory(sub.type)}
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

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：黑色羽绒服"
                className="input-field"
              />
            </div>

            {/* Usage */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">用途</label>
              <div className="flex gap-2">
                {USAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setUsage(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      usage === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warmth Level */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                保暖等级 <span className="text-primary font-bold ml-1">{warmthLevel}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <button
                    key={level}
                    onClick={() => setWarmthLevel(level)}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
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
                <span>轻薄</span>
                <span>保暖</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {showWaterWind && (
                <>
                  <ToggleRow
                    label="防水"
                    checked={waterResistant}
                    onChange={setWaterResistant}
                  />
                  <ToggleRow
                    label="防风"
                    checked={windResistant}
                    onChange={setWindResistant}
                  />
                </>
              )}
              {selectedCategory === 'bottom' && (
                <ToggleRow
                  label="有口袋（可放能量胶）"
                  checked={hasPockets}
                  onChange={setHasPockets}
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border shrink-0">
          <Button 
            className="w-full h-12 text-base"
            disabled={!subCategory || !name.trim()}
            onClick={handleSubmit}
          >
            {isEditing ? '保存' : '添加'}
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

// 快速添加模板组件
function QuickAddTemplates({ 
  onAddTemplate, 
  onAddSingle 
}: { 
  onAddTemplate: (template: QuickTemplate) => void;
  onAddSingle: (category?: ClothingCategory) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const handleAdd = async () => {
    if (!selectedTemplate) return;
    setAdding(true);
    await onAddTemplate(selectedTemplate);
    setAdding(false);
    setSelectedTemplate(null);
  };
  
  if (selectedTemplate) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => setSelectedTemplate(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回
          </button>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{selectedTemplate.icon}</span>
            <div className="text-left">
              <h3 className="font-medium">{selectedTemplate.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-muted-foreground">包含衣物：</p>
            {selectedTemplate.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <span className="text-muted-foreground">{CATEGORIES.find(c => c.type === item.category)?.icon}</span>
                <span>{item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">保暖{item.warmthLevel}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setSelectedTemplate(null)}
              disabled={adding}
            >
              取消
            </Button>
            <Button 
              className="flex-1"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? '添加中...' : '确认添加'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (showCategoryPicker) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => setShowCategoryPicker(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回
          </button>
        </div>
        
        <p className="text-sm font-medium mb-3 text-muted-foreground">选择分类</p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.type}
              onClick={() => {
                onAddSingle(cat.type);
                setShowCategoryPicker(false);
              }}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 快速模板 */}
      <div>
        <p className="text-sm font-medium mb-3 text-muted-foreground">快速开始（一键添加套装）</p>
        <div className="space-y-2">
          {QUICK_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
            >
              <span className="text-2xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground truncate">{template.description} · {template.items.length}件衣物</div>
              </div>
              <ChevronLeft size={16} className="text-muted-foreground rotate-180" />
            </button>
          ))}
        </div>
      </div>
      
      {/* 分隔线 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">或</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      
      {/* 单独添加 */}
      <button
        onClick={() => setShowCategoryPicker(true)}
        className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-all text-muted-foreground hover:text-foreground"
      >
        <Plus size={18} />
        <span>手动添加衣物</span>
      </button>
    </div>
  );
}


// 快速添加模态框（非空衣柜时使用）
function QuickAddModal({
  onClose,
  onAddTemplate,
  onAddSingle,
}: {
  onClose: () => void;
  onAddTemplate: (template: QuickTemplate) => void;
  onAddSingle: (category?: ClothingCategory) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [adding, setAdding] = useState(false);
  
  const handleAdd = async () => {
    if (!selectedTemplate) return;
    setAdding(true);
    await onAddTemplate(selectedTemplate);
    setAdding(false);
    // 添加成功后关闭模态框并提示
    toast({ title: `已添加 ${selectedTemplate.name}`, description: `成功添加 ${selectedTemplate.items.length} 件衣物` });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="safe-area-header px-5 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">快速添加</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto px-5 pb-8">
          {selectedTemplate ? (
            <div className="animate-fade-in">
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                ← 返回
              </button>
              
              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{selectedTemplate.icon}</span>
                  <div>
                    <h3 className="font-medium">{selectedTemplate.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-muted-foreground">包含衣物：</p>
                  {selectedTemplate.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm pl-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      <span className="text-muted-foreground">
                        {CATEGORIES.find(c => c.type === item.category)?.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedTemplate(null)}
                    disabled={adding}
                  >
                    取消
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleAdd}
                    disabled={adding}
                  >
                    {adding ? '添加中...' : '确认添加'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 快速模板 */}
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">一键添加套装</p>
                <div className="space-y-2">
                  {QUICK_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
                    >
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {template.description} · {template.items.length}件衣物
                        </div>
                      </div>
                      <ChevronLeft size={16} className="text-muted-foreground rotate-180" />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 分隔线 */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">或</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              {/* 分类添加 */}
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">按分类添加</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.type}
                      onClick={() => onAddSingle(cat.type)}
                      className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
