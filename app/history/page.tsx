'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Calendar, MapPin, Wind, Droplets, Thermometer, Star, Shirt } from 'lucide-react';
import { OutfitHistoryItem, ClothingItem } from '@/types';
import { getOutfitHistory, deleteOutfitHistory, updateOutfitHistoryRating } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [history, setHistory] = useState<OutfitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
      setDeletingId(id);
      await deleteOutfitHistory(id);
      setHistory(history.filter(h => h.id !== id));
      toast({ title: '已删除' });
    } catch (error) {
      toast({ title: '删除失败', variant: 'destructive' });
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
            onClick={() => router.push('/')}
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

                  {/* Outfit Items */}
                  <div className="p-3">
                    <div className="grid grid-cols-4 gap-2">
                      {/* Main items */}
                      <ItemDisplay item={items.top} />
                      <ItemDisplay item={items.bottom} />
                      <ItemDisplay item={items.socks} />
                      <ItemDisplay item={items.shoes} />
                    </div>
                    
                    {/* Optional hat */}
                    {items.hat && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">配饰:</span>
                        <ItemDisplay item={items.hat} compact />
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
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
}

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

  const getLabel = (category: string) => {
    switch (category) {
      case 'top': return '上衣';
      case 'bottom': return '下装';
      case 'socks': return '袜子';
      case 'shoes': return '鞋子';
      case 'hat': return '帽子';
      default: return category;
    }
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
      <span className="text-[10px] text-muted-foreground mb-0.5">{getLabel(item.category)}</span>
      <span className="text-xs font-medium truncate w-full">{item.name}</span>
      {/* Tags */}
      <div className="flex gap-0.5 mt-1">
        {item.waterResistant && (
          <span className="w-3 h-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[6px] flex items-center justify-center" title="防水">💧</span>
        )}
        {item.windResistant && (
          <span className="w-3 h-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[6px] flex items-center justify-center" title="防风">🌬️</span>
        )}
      </div>
    </div>
  );
}
