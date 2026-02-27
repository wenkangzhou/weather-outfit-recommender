'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { X, Plus, ChevronLeft, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { ClothingItem, ClothingCategory, ClothingSubCategory } from '@/types';
import { getClothingItems, addClothingItem, updateClothingItem, deleteClothingItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
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
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClothingItem | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<ClothingCategory | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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

  const handleUpdateItem = async (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => {
    await updateClothingItem(id, updates);
    await loadItems();
    setEditingItem(null);
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

  const groupedItems = {
    top: items.filter(i => i.category === 'top'),
    bottom: items.filter(i => i.category === 'bottom'),
    socks: items.filter(i => i.category === 'socks'),
    shoes: items.filter(i => i.category === 'shoes'),
    hat: items.filter(i => i.category === 'hat'),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="pt-12 pb-4 px-5 flex items-center gap-4">
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
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-4xl">
                👕
              </div>
              <p className="text-muted-foreground mb-2">{t('outfit.emptyWardrobe')}</p>
              <p className="text-sm text-muted-foreground/70">点击下方分类添加衣物</p>
            </div>
          ) : (
            <div className="space-y-4">
              {CATEGORIES.map(cat => (
                <CategorySection
                  key={cat.type}
                  category={cat}
                  items={groupedItems[cat.type]}
                  isExpanded={expandedCategories[cat.type] || false}
                  onToggle={() => toggleCategory(cat.type)}
                  onEdit={setEditingItem}
                  onDelete={setDeletingItem}
                  onAdd={() => {
                    setEditingItem(null);
                    setDefaultCategory(cat.type);
                    setShowAddModal(true);
                  }}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <AddEditItemModal 
          item={editingItem}
          defaultCategory={defaultCategory}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
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
  onAdd,
  t,
}: {
  category: typeof CATEGORIES[0];
  items: ClothingItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onAdd: () => void;
  t: any;
}) {
  const showCount = isExpanded ? items.length : INITIAL_SHOW_COUNT;
  const displayedItems = items.slice(0, showCount);
  const hasMore = items.length > INITIAL_SHOW_COUNT;

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
          {displayedItems.map((item, index) => (
            <div
              key={item.id}
              className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors group"
            >
              {/* Index Number */}
              <span className="text-xs text-muted-foreground w-5">{index + 1}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)}</span>
                  
                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap">
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
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => onEdit(item)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground text-sm">
          暂无{category.label}，点击上方添加
        </div>
      )}

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={onToggle}
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
  defaultCategory,
  onClose, 
  onAdd,
  onUpdate,
}: { 
  item: ClothingItem | null;
  defaultCategory?: ClothingCategory;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => void;
}) {
  const { t } = useTranslation();
  const isEditing = !!item;
  const selectedCategory = item?.category || defaultCategory;
  
  const [name, setName] = useState(item?.name || '');
  const [subCategory, setSubCategory] = useState<ClothingSubCategory | null>(item?.subCategory || null);
  const [warmthLevel, setWarmthLevel] = useState(item?.warmthLevel || 5);
  const [waterResistant, setWaterResistant] = useState(item?.waterResistant || false);
  const [windResistant, setWindResistant] = useState(item?.windResistant || false);
  const [hasPockets, setHasPockets] = useState(item?.hasPockets || false);
  const [usage, setUsage] = useState<'commute' | 'running' | 'both'>(item?.usage || 'both');

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

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Modal Header */}
        <header className="pt-12 pb-4 px-5 flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={20} />
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditing ? '编辑衣物' : `添加${categoryInfo?.label || '衣物'}`}
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
