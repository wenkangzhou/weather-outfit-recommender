'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Package, History, Plus, Trash2, 
  Thermometer, Wind, Droplets, ChevronRight 
} from 'lucide-react';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Menu View
  if (activeSection === 'menu') {
    return (
      <div className="p-4 space-y-3">
        <MenuItem
          icon={<Package className="text-blue-500" />}
          title="我的衣柜"
          subtitle={`已录入 ${clothingItems.length} 件衣物`}
          onClick={() => setActiveSection('wardrobe')}
        />
        <MenuItem
          icon={<History className="text-green-500" />}
          title="穿搭历史"
          subtitle={`${outfitHistory.length} 条记录`}
          onClick={() => setActiveSection('history')}
        />
        <MenuItem
          icon={<Settings className="text-purple-500" />}
          title="个性化设置"
          subtitle="偏好、敏感度、位置"
          onClick={() => setActiveSection('settings')}
        />
      </div>
    );
  }

  // Wardrobe View
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

  // History View
  if (activeSection === 'history') {
    return (
      <HistoryView
        history={outfitHistory}
        onBack={() => setActiveSection('menu')}
      />
    );
  }

  // Settings View
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

// Sub-components
function MenuItem({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 hover:border-primary-300 transition-colors"
    >
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      <ChevronRight size={20} className="text-gray-400" />
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
    color: '#000000',
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
      setFormData({
        name: '',
        subCategory: '',
        warmthLevel: 5,
        waterResistant: false,
        windResistant: false,
        color: '#000000',
      });
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← 返回</button>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 text-primary-600 font-medium"
        >
          <Plus size={18} />
          添加
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-gray-200 mb-4 space-y-3">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ClothingCategory);
              setFormData(prev => ({ ...prev, subCategory: '' }));
            }}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="top">上衣</option>
            <option value="bottom">下装</option>
            <option value="socks">袜子</option>
            <option value="shoes">鞋子</option>
          </select>

          <input
            type="text"
            placeholder="名称（如：白色T恤）"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />

          <select
            value={formData.subCategory}
            onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">选择类型</option>
            {SUB_CATEGORIES[category].map(sub => (
              <option key={sub.value} value={sub.value}>{sub.label}</option>
            ))}
          </select>

          <div>
            <label className="text-sm text-gray-600">保暖度: {formData.warmthLevel}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.warmthLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, warmthLevel: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.waterResistant}
                onChange={(e) => setFormData(prev => ({ ...prev, waterResistant: e.target.checked }))}
              />
              <span className="text-sm">防水</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.windResistant}
                onChange={(e) => setFormData(prev => ({ ...prev, windResistant: e.target.checked }))}
              />
              <span className="text-sm">防风</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 text-gray-600"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg"
            >
              保存
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([cat, catItems]) => (
          catItems.length > 0 && (
            <div key={cat}>
              <h3 className="font-medium text-gray-700 mb-2">{categoryLabels[cat]} ({catItems.length})</h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                        {cat === 'top' ? '👕' : cat === 'bottom' ? '👖' : cat === 'socks' ? '🧦' : '👟'}
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {'🔥'.repeat(Math.ceil(item.warmthLevel / 2))}
                          {item.waterResistant && ' 💧'}
                          {item.windResistant && ' 🌬️'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function HistoryView({ history, onBack }: {
  history: Outfit[];
  onBack: () => void;
}) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mb-4">← 返回</button>
      
      {history.length === 0 ? (
        <div className="text-center text-gray-500 py-8">还没有穿搭记录</div>
      ) : (
        <div className="space-y-3">
          {history.map((outfit) => (
            <div key={outfit.id} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-400 mb-2">
                {new Date(outfit.createdAt).toLocaleDateString('zh-CN')}
                {' · '}
                {outfit.scene === 'commute' ? '通勤' : '跑步'}
                {' · '}
                {outfit.weatherSnapshot.temp}°C
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl">{outfit.top?.name}</span>
                <span className="text-gray-300">+</span>
                <span className="text-2xl">{outfit.bottom?.name}</span>
                <span className="text-gray-300">+</span>
                <span className="text-2xl">{outfit.shoes?.name}</span>
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
    <div className="p-4">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mb-4">← 返回</button>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-medium text-gray-900">基本设置</h3>
          
          <div>
            <label className="text-sm text-gray-600">所在城市</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              placeholder="如：北京"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">通勤距离(km)</label>
              <input
                type="number"
                value={formData.commuteDistance}
                onChange={(e) => setFormData(prev => ({ ...prev, commuteDistance: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">跑步距离(km)</label>
              <input
                type="number"
                value={formData.runDistance}
                onChange={(e) => setFormData(prev => ({ ...prev, runDistance: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-medium text-gray-900">体感偏好</h3>
          
          <div>
            <label className="text-sm text-gray-600">怕冷程度: {formData.coldSensitivity}/5</label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.coldSensitivity}
              onChange={(e) => setFormData(prev => ({ ...prev, coldSensitivity: parseInt(e.target.value) }))}
              className="w-full mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">怕热程度: {formData.hotSensitivity}/5</label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.hotSensitivity}
              onChange={(e) => setFormData(prev => ({ ...prev, hotSensitivity: parseInt(e.target.value) }))}
              className="w-full mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">出汗程度</label>
            <select
              value={formData.sweatLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, sweatLevel: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
            >
              <option value="low">少汗</option>
              <option value="medium">中等</option>
              <option value="high">多汗</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">对风敏感</span>
            <input
              type="checkbox"
              checked={formData.windSensitivity}
              onChange={(e) => setFormData(prev => ({ ...prev, windSensitivity: e.target.checked }))}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
        >
          保存设置
        </button>
      </form>
    </div>
  );
}
