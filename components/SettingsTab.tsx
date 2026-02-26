'use client';

import { useState, useEffect } from 'react';
import { Settings, Package, History, Plus, Trash2, ChevronRight, MapPin } from 'lucide-react';
import { ClothingItem, ClothingCategory, ClothingSubCategory, UserPreferences, Outfit } from '@/types';
import { getClothingItems, addClothingItem, deleteClothingItem, getUserPreferences, saveUserPreferences, getOutfitHistory } from '@/lib/supabase';

const SUB_CATEGORIES: Record<ClothingCategory, { value: ClothingSubCategory; label: string }[]> = {
  top: [
    { value: 't-shirt', label: 'T恤' },
    { value: 'long-sleeve', label: '长袖' },
    { value: 'sweater', label: '毛衣' },
    { value: 'hoodie', label: '卫衣' },
    { value: 'jacket', label: '夹克' },
    { value: 'down-jacket', label: '羽绒服' },
    { value: 'windbreaker', label: '冲锋衣' },
  ],
  bottom: [
    { value: 'shorts', label: '短裤' },
    { value: 'pants', label: '长裤' },
    { value: 'sweatpants', label: '运动裤' },
    { value: 'thermal-pants', label: '保暖裤' },
  ],
  socks: [
    { value: 'short-socks', label: '短袜' },
    { value: 'long-socks', label: '长袜' },
    { value: 'thick-socks', label: '厚袜' },
  ],
  shoes: [
    { value: 'sneakers', label: '运动鞋' },
    { value: 'running-shoes', label: '跑鞋' },
    { value: 'casual-shoes', label: '休闲鞋' },
    { value: 'boots', label: '靴子' },
  ],
};

export default function SettingsTab() {
  const [activeSection, setActiveSection] = useState<'menu' | 'wardrobe' | 'history' | 'settings'>('menu');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [outfitHistory, setOutfitHistory] = useState<Outfit[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [items, prefs, history] = await Promise.all([
        getClothingItems(),
        getUserPreferences(),
        getOutfitHistory(),
      ]);
      setClothingItems(items);
      setPreferences(prefs);
      setOutfitHistory(history);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('确定删除这件衣服吗？')) return;
    try {
      await deleteClothingItem(id);
      setClothingItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (activeSection === 'menu') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center py-8">
          <h1 className="text-3xl font-semibold text-white mb-2">设置</h1>
          <p className="text-white/60">管理你的衣柜和偏好</p>
        </div>
        
        <div className="space-y-3">
          <MenuCard
            icon={<Package className="text-blue-400" size={24} />}
            title="我的衣柜"
            subtitle={`${clothingItems.length} 件衣物`}
            onClick={() => setActiveSection('wardrobe')}
          />
          <MenuCard
            icon={<History className="text-green-400" size={24} />}
            title="穿搭历史"
            subtitle={`${outfitHistory.length} 条记录`}
            onClick={() => setActiveSection('history')}
          />
          <MenuCard
            icon={<Settings className="text-purple-400" size={24} />}
            title="个性化设置"
            subtitle="位置、偏好、体感"
            onClick={() => setActiveSection('settings')}
          />
        </div>
      </div>
    );
  }

  if (activeSection === 'wardrobe') {
    return (
      <WardrobeView
        items={clothingItems}
        onBack={() => setActiveSection('menu')}
        onAddItem={(item) => setClothingItems(prev => [item, ...prev])}
        onDeleteItem={handleDeleteItem}
      />
    );
  }

  if (activeSection === 'history') {
    return (
      <HistoryView
        history={outfitHistory}
        onBack={() => setActiveSection('menu')}
      />
    );
  }

  if (activeSection === 'settings') {
    return (
      <SettingsView
        preferences={preferences}
        onBack={() => setActiveSection('menu')}
        onSave={(prefs) => {
          setPreferences(prefs);
          setActiveSection('menu');
        }}
      />
    );
  }

  return null;
}

function MenuCard({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full glass-card p-4 flex items-center gap-4 hover:bg-white/20 transition-all active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-white font-semibold text-lg">{title}</div>
        <div className="text-white/50 text-sm">{subtitle}</div>
      </div>
      <ChevronRight size={20} className="text-white/40" />
    </button>
  );
}

function WardrobeView({ items, onBack, onAddItem, onDeleteItem }: {
  items: ClothingItem[];
  onBack: () => void;
  onAddItem: (item: ClothingItem) => void;
  onDeleteItem: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [formData, setFormData] = useState({
    name: '',
    subCategory: '',
    warmthLevel: 5,
    waterResistant: false,
    windResistant: false,
    color: '#ffffff',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = await addClothingItem({
        ...formData,
        category,
        subCategory: formData.subCategory as ClothingSubCategory,
        imageUrl: undefined,
      });
      onAddItem(newItem);
      setShowAddForm(false);
      setFormData({ name: '', subCategory: '', warmthLevel: 5, waterResistant: false, windResistant: false, color: '#ffffff' });
    } catch (error) {
      alert('添加失败');
    }
  };

  const groupedItems = {
    top: items.filter(i => i.category === 'top'),
    bottom: items.filter(i => i.category === 'bottom'),
    socks: items.filter(i => i.category === 'socks'),
    shoes: items.filter(i => i.category === 'shoes'),
  };

  const categoryLabels: Record<string, string> = {
    top: '上衣',
    bottom: '下装',
    socks: '袜子',
    shoes: '鞋子',
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center gap-1">
          ← 返回
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-6">我的衣柜</h2>

      {showAddForm && (
        <div className="glass-card p-4 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value as ClothingCategory); setFormData(prev => ({ ...prev, subCategory: '' })); }}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
            >
              <option value="top" className="bg-gray-800">上衣</option>
              <option value="bottom" className="bg-gray-800">下装</option>
              <option value="socks" className="bg-gray-800">袜子</option>
              <option value="shoes" className="bg-gray-800">鞋子</option>
            </select>

            <input
              type="text"
              placeholder="名称（如：白色T恤）"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40"
              required
            />

            <select
              value={formData.subCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
              required
            >
              <option value="" className="bg-gray-800">选择类型</option>
              {SUB_CATEGORIES[category].map(sub => (
                <option key={sub.value} value={sub.value} className="bg-gray-800">{sub.label}</option>
              ))}
            </select>

            <div>
              <label className="text-white/70 text-sm">保暖度: {formData.warmthLevel}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.warmthLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, warmthLevel: parseInt(e.target.value) }))}
                className="w-full mt-2 accent-white"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" checked={formData.waterResistant} onChange={(e) => setFormData(prev => ({ ...prev, waterResistant: e.target.checked }))} className="accent-blue-500" />
                防水
              </label>
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" checked={formData.windResistant} onChange={(e) => setFormData(prev => ({ ...prev, windResistant: e.target.checked }))} className="accent-gray-500" />
                防风
              </label>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 text-white/70 hover:text-white">取消</button>
              <button type="submit" className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium">保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([cat, catItems]) =>
          catItems.length > 0 && (
            <div key={cat}>
              <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wider">{categoryLabels[cat]}</h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="glass-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                        {cat === 'top' ? '👕' : cat === 'bottom' ? '👖' : cat === 'socks' ? '🧦' : '👟'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-white/50 text-sm">
                          {'🔥'.repeat(Math.ceil(item.warmthLevel / 2))}
                          {item.waterResistant && ' 💧'}
                          {item.windResistant && ' 🌬️'}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onDeleteItem(item.id)} className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function HistoryView({ history, onBack }: { history: Outfit[]; onBack: () => void; }) {
  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="text-white/70 hover:text-white mb-6 flex items-center gap-1">← 返回</button>
      <h2 className="text-2xl font-semibold text-white mb-6">穿搭历史</h2>
      
      {history.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          <div className="text-4xl mb-3">📝</div>
          还没有穿搭记录
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((outfit) => (
            <div key={outfit.id} className="glass-card p-4">
              <div className="text-white/50 text-sm mb-2">
                {new Date(outfit.createdAt).toLocaleDateString('zh-CN')}
                <span className="mx-2">·</span>
                {outfit.scene === 'commute' ? '通勤' : '跑步'}
                <span className="mx-2">·</span>
                {outfit.weatherSnapshot.temp}°C
              </div>
              <div className="flex items-center gap-2 flex-wrap text-white">
                <span>{outfit.top?.name}</span>
                <span className="text-white/30">+</span>
                <span>{outfit.bottom?.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ preferences, onBack, onSave }: {
  preferences: UserPreferences | null;
  onBack: () => void;
  onSave: (prefs: UserPreferences) => void;
}) {
  const [formData, setFormData] = useState<Partial<UserPreferences>>({
    location: preferences?.location || '北京',
    commuteDistance: preferences?.commuteDistance || 5,
    runDistance: preferences?.runDistance || 5,
    coldSensitivity: preferences?.coldSensitivity || 3,
    hotSensitivity: preferences?.hotSensitivity || 3,
    sweatLevel: preferences?.sweatLevel || 'medium',
    windSensitivity: preferences?.windSensitivity ?? true,
    rainPreference: preferences?.rainPreference || 'avoid',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await saveUserPreferences(formData as Omit<UserPreferences, 'id'>);
      onSave(saved);
    } catch (error) {
      alert('保存失败');
    }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="text-white/70 hover:text-white mb-6 flex items-center gap-1">← 返回</button>
      <h2 className="text-2xl font-semibold text-white mb-6">个性化设置</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-5 space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-blue-400" size={20} />
            <h3 className="text-white font-semibold">基本设置</h3>
          </div>
          
          <div>
            <label className="text-white/70 text-sm">所在城市</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-3 mt-2 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="如：北京"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm">通勤距离(km)</label>
              <input type="number" value={formData.commuteDistance} onChange={(e) => setFormData(prev => ({ ...prev, commuteDistance: parseFloat(e.target.value) }))} className="w-full p-3 mt-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-white/70 text-sm">跑步距离(km)</label>
              <input type="number" value={formData.runDistance} onChange={(e) => setFormData(prev => ({ ...prev, runDistance: parseFloat(e.target.value) }))} className="w-full p-3 mt-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-purple-400" size={20} />
            <h3 className="text-white font-semibold">体感偏好</h3>
          </div>
          
          <div>
            <label className="text-white/70 text-sm">怕冷程度: {formData.coldSensitivity}/5</label>
            <input type="range" min="1" max="5" value={formData.coldSensitivity} onChange={(e) => setFormData(prev => ({ ...prev, coldSensitivity: parseInt(e.target.value) }))} className="w-full mt-2 accent-white" />
          </div>

          <div>
            <label className="text-white/70 text-sm">怕热程度: {formData.hotSensitivity}/5</label>
            <input type="range" min="1" max="5" value={formData.hotSensitivity} onChange={(e) => setFormData(prev => ({ ...prev, hotSensitivity: parseInt(e.target.value) }))} className="w-full mt-2 accent-white" />
          </div>

          <div>
            <label className="text-white/70 text-sm">出汗程度</label>
            <select value={formData.sweatLevel} onChange={(e) => setFormData(prev => ({ ...prev, sweatLevel: e.target.value as any }))} className="w-full p-3 mt-2 bg-white/10 border border-white/20 rounded-xl text-white">
              <option value="low" className="bg-gray-800">少汗</option>
              <option value="medium" className="bg-gray-800">中等</option>
              <option value="high" className="bg-gray-800">多汗</option>
            </select>
          </div>

          <label className="flex items-center justify-between text-white/80">
            <span>对风敏感</span>
            <input type="checkbox" checked={formData.windSensitivity} onChange={(e) => setFormData(prev => ({ ...prev, windSensitivity: e.target.checked }))} className="accent-white w-5 h-5" />
          </label>
        </div>

        <button type="submit" className="w-full py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-medium transition-all">
          保存设置
        </button>
      </form>
    </div>
  );
}
