'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { X, Plus, ChevronLeft, Pencil, Trash2, MoreVertical } from 'lucide-react';
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

export default function WardrobePage() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <WardrobeContent />
      </I18nProvider>
    </ThemeProvider>
  );
}

function WardrobeContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClothingItem | null>(null);

  useEffect(() => {
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
        <header className="pt-12 pb-6 px-5 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">{t('settings.myWardrobe')}</h1>
          <div className="flex-1" />
          <Button 
            size="icon" 
            className="rounded-full bg-primary"
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
          >
            <Plus size={20} />
          </Button>
        </header>

        {/* Content */}
        <div className="px-5 pb-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-4xl">
                👕
              </div>
              <p className="text-muted-foreground mb-2">{t('outfit.emptyWardrobe')}</p>
              <p className="text-sm text-muted-foreground/70">点击右上角 + 添加衣服</p>
            </div>
          ) : (
            <div className="space-y-6">
              {CATEGORIES.map(cat => (
                <section key={cat.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-muted-foreground">{cat.label}</span>
                    <span className="text-xs text-muted-foreground/60">({groupedItems[cat.type].length})</span>
                  </div>
                  {groupedItems[cat.type].length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {groupedItems[cat.type].map(item => (
                        <Card key={item.id} className="p-3 border-border/50 relative group">
                          {/* Actions Menu */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="flex gap-1">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="w-7 h-7 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(item);
                                  setShowAddModal(true);
                                }}
                              >
                                <Pencil size={12} />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="w-7 h-7 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingItem(item);
                                }}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>

                          <div className="aspect-square rounded-xl bg-muted flex items-center justify-center text-3xl mb-3">
                            {cat.icon}
                          </div>
                          <div className="font-medium text-sm truncate pr-6">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)}</div>
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {item.usage === 'running' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                                跑
                              </span>
                            )}
                            {item.usage === 'commute' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                通
                              </span>
                            )}
                            {item.usage === 'both' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                                皆可
                              </span>
                            )}
                            {cat.showWaterWind && item.waterResistant && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                防水
                              </span>
                            )}
                            {cat.showWaterWind && item.windResistant && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                防风
                              </span>
                            )}
                            {item.hasPockets && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                                口袋
                              </span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground/60 py-2">暂无{cat.label}</div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <AddEditItemModal 
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
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

function AddEditItemModal({ 
  item,
  onClose, 
  onAdd,
  onUpdate,
}: { 
  item: ClothingItem | null;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>) => void;
}) {
  const { t } = useTranslation();
  const isEditing = !!item;
  
  const [step, setStep] = useState<'category' | 'details'>(isEditing ? 'details' : 'category');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(item?.category || null);
  const [name, setName] = useState(item?.name || '');
  const [subCategory, setSubCategory] = useState<ClothingSubCategory | null>(item?.subCategory || null);
  const [warmthLevel, setWarmthLevel] = useState(item?.warmthLevel || 5);
  const [waterResistant, setWaterResistant] = useState(item?.waterResistant || false);
  const [windResistant, setWindResistant] = useState(item?.windResistant || false);
  const [hasPockets, setHasPockets] = useState(item?.hasPockets || false);
  const [usage, setUsage] = useState<'commute' | 'running' | 'both'>(item?.usage || 'both');

  const handleCategorySelect = (cat: ClothingCategory) => {
    setSelectedCategory(cat);
    setSubCategory(null);
    setStep('details');
  };

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

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Modal Header */}
        <header className="pt-12 pb-4 px-5 flex items-center gap-4 shrink-0">
          {step === 'details' && !isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => setStep('category')} className="rounded-full">
              <ChevronLeft size={20} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X size={20} />
            </Button>
          )}
          <h1 className="text-lg font-semibold">
            {isEditing ? '编辑衣物' : (step === 'category' ? '选择分类' : '填写信息')}
          </h1>
        </header>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 'category' && !isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.type}
                  onClick={() => handleCategorySelect(cat.type)}
                  className="p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-accent transition-all flex flex-col items-center gap-3"
                >
                  <span className="text-4xl">{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Category Display (when editing) */}
              {isEditing && selectedCategory && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">分类</label>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                    <span className="text-2xl">
                      {CATEGORIES.find(c => c.type === selectedCategory)?.icon}
                    </span>
                    <span className="font-medium">
                      {CATEGORIES.find(c => c.type === selectedCategory)?.label}
                    </span>
                  </div>
                </div>
              )}

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
          )}
        </div>

        {/* Modal Footer */}
        {(step === 'details' || isEditing) && (
          <div className="p-5 border-t border-border shrink-0">
            <Button 
              className="w-full h-12 text-base"
              disabled={!subCategory || !name.trim()}
              onClick={handleSubmit}
            >
              {isEditing ? '保存' : '添加'}
            </Button>
          </div>
        )}
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
