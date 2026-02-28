'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2, Calendar, MapPin, Wind, Droplets, Thermometer, Star, Shirt } from 'lucide-react';
import { OutfitHistoryItem, ClothingItem } from '@/types';
import { getOutfitHistory, deleteOutfitHistory, updateOutfitHistoryRating } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  
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
  const [history, setHistory] = useState<OutfitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; dateLabel?: string } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getOutfitHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, dateLabel?: string) => {
    setDeleteConfirm({ show: true, id, dateLabel });
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    const idToDelete = deleteConfirm.id;
    const previousCount = history.length;
    console.log(`[Delete] Start. ID: ${idToDelete}, Current count: ${previousCount}`);
    console.log('[Delete] All IDs:', history.map(h => h.id));
    
    // 保存当前状态用于恢复
    const previousHistory = [...history];
    
    try {
      setDeletingId(idToDelete);
      
      // 1. 先从 UI 中移除（乐观更新）
      setHistory(prev => {
        const filtered = prev.filter(h => h.id !== idToDelete);
        console.log(`[Delete] Filtered: ${filtered.length} (removed ${prev.length - filtered.length})`);
        return filtered;
      });
      
      // 2. 关闭对话框
      setDeleteConfirm(null);
      
      // 3. 调用 API 删除
      console.log('[Delete] Calling API...');
      await deleteOutfitHistory(idToDelete);
      console.log('[Delete] API success');
      
      // 4. 显示成功提示，不再重新加载（避免竞态）
      toast({ title: '已删除' });
      
      // 不再后台同步，避免删除失败时恢复记录
    } catch (error) {
      console.error('[Delete] Error:', error);
      toast({ title: '删除失败', variant: 'destructive' });
      // 删除失败，重新加载确保显示正确数据
      const serverHistory = await getOutfitHistory();
      setHistory(serverHistory);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    try {
      await updateOutfitHistoryRating(id, rating);
      setHistory(history.map(h => 
        h.id === id ? { ...h, comfortRating: rating } : h
      ));
    } catch (error) {
      console.error('Failed to rate:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'top': return '👕';
      case 'bottom': return '👖';
      case 'socks': return '🧦';
      case 'shoes': return '👟';
      case 'hat': return '🧢';
      default: return '👔';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'top': return '上衣';
      case 'bottom': return '下装';
      case 'socks': return '袜子';
      case 'shoes': return '鞋子';
      case 'hat': return '帽子';
      default: return category;
    }
  };

  const getSceneLabel = (scene: string, runType?: string) => {
    if (scene === 'commute') return '通勤';
    if (scene === 'running') {
      const runLabels: Record<string, string> = {
        easy: '有氧跑',
        long: '长距离',
        interval: '间歇跑',
      };
      return runLabels[runType || 'easy'] || '跑步';
    }
    return scene;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">历史穿搭</h1>
          <span className="ml-auto text-sm text-muted-foreground">
            共 {history.length} 条记录
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-20">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-4xl mb-4">
              <Shirt size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">还没有穿搭记录</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              在首页生成穿搭推荐后，点击「确认穿搭」即可保存记录
            </p>
            <Button onClick={() => router.push('/')}>
              去生成穿搭
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const dateInfo = formatDate(item.wornAt);
              const { items, weatherData } = item;

              return (
                <Card key={item.id} className="overflow-hidden">
                  {/* Header: Date & Weather */}
                  <div className="p-3 bg-muted/50 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-center min-w-[48px]">
                          <div className="text-lg font-semibold leading-none">{dateInfo.date}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{dateInfo.weekday}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateInfo.time}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Weather Summary */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-0.5">
                            <Thermometer size={12} />
                            {Math.round(weatherData.temp)}°
                          </span>
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <Wind size={12} />
                            {Math.round(weatherData.windSpeed)}m/s
                          </span>
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <Droplets size={12} />
                            {weatherData.humidity}%
                          </span>
                        </div>
                        
                        {/* Scene Badge */}
                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {getSceneLabel(item.scene, item.runType)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                      <MapPin size={11} />
                      {item.locationName}
                    </div>
                  </div>

                  {/* Outfit Items - 重新设计布局 */}
                  <div className="p-3">
                    {/* 上衣区域 - 单独突出显示 */}
                    <div className="mb-3">
                      <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">上衣搭配</div>
                      {items.layeredTops && items.layeredTops.length > 1 ? (
                        <div className="space-y-1.5 bg-muted/30 rounded-xl p-2">
                          {items.layeredTops.map((layer, idx) => (
                            <div key={layer.id} className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                idx === 0 ? 'bg-emerald-100 text-emerald-700' : 
                                idx === items.layeredTops!.length - 1 ? 'bg-amber-100 text-amber-700' : 
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {idx === 0 ? '内层' : idx === items.layeredTops!.length - 1 ? '外层' : '中层'}
                              </span>
                              <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-2 py-1.5">
                                <span className="text-lg">👕</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">{layer.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{subCategoryLabels[layer.subCategory] || layer.subCategory}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-muted/30 rounded-xl p-2">
                          <div className="flex items-center gap-2 bg-background rounded-lg px-2 py-1.5">
                            <span className="text-lg">👕</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{items.top?.name}</div>
                              <div className="text-[10px] text-muted-foreground">{subCategoryLabels[items.top?.subCategory] || items.top?.subCategory}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 其他衣物 - 网格布局 */}
                    <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">其他搭配</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/30 rounded-xl p-2 text-center">
                        <div className="text-lg mb-0.5">👖</div>
                        <div className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full inline-block mb-0.5">
                          {subCategoryLabels[items.bottom?.subCategory] || items.bottom?.subCategory}
                        </div>
                        <div className="text-xs font-medium truncate">{items.bottom?.name}</div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-2 text-center">
                        <div className="text-lg mb-0.5">🧦</div>
                        <div className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full inline-block mb-0.5">
                          {subCategoryLabels[items.socks?.subCategory] || items.socks?.subCategory}
                        </div>
                        <div className="text-xs font-medium truncate">{items.socks?.name}</div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-2 text-center">
                        <div className="text-lg mb-0.5">👟</div>
                        <div className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full inline-block mb-0.5">
                          {subCategoryLabels[items.shoes?.subCategory] || items.shoes?.subCategory}
                        </div>
                        <div className="text-xs font-medium truncate">{items.shoes?.name}</div>
                      </div>
                    </div>
                    
                    {/* Optional hat */}
                    {items.hat && (
                      <div className="mt-2 flex items-center gap-2 bg-muted/30 rounded-xl p-2">
                        <span className="text-lg">🧢</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                          {subCategoryLabels[items.hat?.subCategory] || items.hat?.subCategory}
                        </span>
                        <span className="text-xs font-medium">{items.hat?.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Rating & Actions */}
                  <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">舒适度:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(item.id, star)}
                          className={`transition-colors ${
                            (item.comfortRating || 0) >= star
                              ? 'text-amber-400'
                              : 'text-muted-foreground/30 hover:text-amber-300'
                          }`}
                        >
                          <Star size={14} fill={(item.comfortRating || 0) >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(item.id, `${dateInfo.date} ${dateInfo.weekday} ${dateInfo.time}`)}
                      disabled={deletingId === item.id}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirm Modal */}
      {deleteConfirm?.show && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 size={24} className="text-destructive" />
              </div>
              <h3 className="text-lg font-medium mb-2">删除这条记录？</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {deleteConfirm.dateLabel || '这条穿搭记录'}
              </p>
              <p className="text-xs text-muted-foreground/60 mb-6">
                此操作不可撤销
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deletingId === deleteConfirm.id}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmDelete}
                  disabled={deletingId === deleteConfirm.id}
                >
                  {deletingId === deleteConfirm.id ? '删除中...' : '删除'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Sub-category label mapping
const subCategoryLabels: Record<string, string> = {
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

// Item Display Component
function ItemDisplay({ item, compact = false }: { item: ClothingItem; compact?: boolean }) {
  const getIcon = (category: string) => {
    switch (category) {
      case 'top': return '👕';
      case 'bottom': return '👖';
      case 'socks': return '🧦';
      case 'shoes': return '👟';
      case 'hat': return '🧢';
      default: return '👔';
    }
  };

  const getSubCategoryLabel = (subCategory: string) => {
    return subCategoryLabels[subCategory] || subCategory;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
        <span className="text-sm">{getIcon(item.category)}</span>
        <span className="text-xs truncate max-w-[80px]">{item.name}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
      <span className="text-xl mb-1">{getIcon(item.category)}</span>
      {/* 子分类标签 */}
      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full mb-1">
        {getSubCategoryLabel(item.subCategory)}
      </span>
      <span className="text-xs font-medium truncate w-full">{item.name}</span>
      {/* Feature Tags */}
      <div className="flex gap-0.5 mt-1">
        {item.waterResistant && (
          <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[8px] flex items-center justify-center" title="防水">💧</span>
        )}
        {item.windResistant && (
          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[8px] flex items-center justify-center" title="防风">🌬️</span>
        )}
        {item.hasPockets && (
          <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-[8px] flex items-center justify-center" title="口袋">👝</span>
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function HistoryLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <HistoryContent />
    </Suspense>
  );
}
