'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserPreferences } from '@/types';
import { getUserPreferences, saveUserPreferences } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export default function TemperatureSettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 温度状态
  const [commuteTargetTemp, setCommuteTargetTemp] = useState<number>(24);
  const [easyRunTargetTemp, setEasyRunTargetTemp] = useState<number>(12);
  const [longRunTargetTemp, setLongRunTargetTemp] = useState<number>(10);
  const [intervalRunTargetTemp, setIntervalRunTargetTemp] = useState<number>(8);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    console.log('[TemperatureSettings] ===== Loading preferences... =====');
    try {
      const prefs = await getUserPreferences();
      console.log('[TemperatureSettings] Loaded:', prefs);
      
      if (prefs) {
        setPreferences(prefs);
        setCommuteTargetTemp(prefs.commuteTargetTemp ?? 24);
        setEasyRunTargetTemp(prefs.easyRunTargetTemp ?? 12);
        setLongRunTargetTemp(prefs.longRunTargetTemp ?? 10);
        setIntervalRunTargetTemp(prefs.intervalRunTargetTemp ?? 8);
      } else {
        console.log('[TemperatureSettings] No prefs found, will create on first save');
        // 设置一个标记表示还没有创建过偏好设置
        setPreferences(null);
      }
    } catch (err) {
      console.error('[TemperatureSettings] Load error:', err);
    }
    setLoading(false);
    console.log('[TemperatureSettings] ===== Load complete =====');
  };

  const handleSave = async (updates: Partial<UserPreferences>) => {
    console.log('[TemperatureSettings] ===== handleSave START =====');
    console.log('[TemperatureSettings] Saving:', updates);
    
    if (!preferences) {
      console.warn('[TemperatureSettings] No preferences loaded, creating default');
      // 如果没有加载到偏好设置，创建一个默认的
      const defaultPrefs: UserPreferences = {
        id: 'temp',
        location: '',
        defaultRunType: 'easy',
        commuteTargetTemp: 24,
        easyRunTargetTemp: 12,
        longRunTargetTemp: 10,
        intervalRunTargetTemp: 8,
        defaultScene: 'commute',
        ...updates,
      };
      
      try {
        const saved = await saveUserPreferences(defaultPrefs);
        console.log('[TemperatureSettings] Saved default prefs:', saved);
        setPreferences(saved);
        toast({ title: '设置已保存' });
      } catch (err) {
        console.error('[TemperatureSettings] Save failed:', err);
        toast({ title: '保存失败', description: String(err), variant: 'destructive' });
      }
      return;
    }
    
    const newPrefs = { ...preferences, ...updates };
    console.log('[TemperatureSettings] Merged prefs:', newPrefs);
    
    try {
      const saved = await saveUserPreferences(newPrefs);
      console.log('[TemperatureSettings] Save success:', saved);
      setPreferences(newPrefs);
      toast({ title: '设置已保存' });
    } catch (err) {
      console.error('[TemperatureSettings] Save error:', err);
      toast({ title: '保存失败', description: String(err), variant: 'destructive' });
    }
    console.log('[TemperatureSettings] ===== handleSave END =====');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          <div className="safe-area-header px-5 pb-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft size={20} />
            </Button>
            <h1 className="text-xl font-semibold">目标温度设置</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="safe-area-header px-5 pb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">目标温度设置</h1>
        </header>

        {/* Content */}
        <div className="px-5 pb-8 space-y-6">
          {/* 通勤目标温度 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">🚶 通勤场景</span>
              <span className="text-primary font-bold">{commuteTargetTemp}°C</span>
            </div>
            <input
              type="range"
              min="16"
              max="30"
              value={commuteTargetTemp}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setCommuteTargetTemp(val);
                handleSave({ commuteTargetTemp: val });
              }}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>16°C（多穿）</span>
              <span>30°C（少穿）</span>
            </div>
          </Card>

          {/* 跑步场景 */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground px-1">🏃 跑步场景（按课表类型）</h2>
            
            {/* 有氧跑 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">有氧跑</span>
                <span className="text-primary font-bold">{easyRunTargetTemp}°C</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                value={easyRunTargetTemp}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setEasyRunTargetTemp(val);
                  handleSave({ easyRunTargetTemp: val });
                }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>5°C（多穿）</span>
                <span>20°C（少穿）</span>
              </div>
            </Card>

            {/* 长距离 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">长距离</span>
                <span className="text-primary font-bold">{longRunTargetTemp}°C</span>
              </div>
              <input
                type="range"
                min="5"
                max="18"
                value={longRunTargetTemp}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLongRunTargetTemp(val);
                  handleSave({ longRunTargetTemp: val });
                }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>5°C（多穿）</span>
                <span>18°C（少穿）</span>
              </div>
            </Card>

            {/* 间歇跑 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">间歇跑</span>
                <span className="text-primary font-bold">{intervalRunTargetTemp}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={intervalRunTargetTemp}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setIntervalRunTargetTemp(val);
                  handleSave({ intervalRunTargetTemp: val });
                }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0°C（多穿）</span>
                <span>15°C（少穿）</span>
              </div>
            </Card>
          </div>

          {/* 说明 */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg space-y-1">
            <p>• 目标温度越高，推荐的衣物越厚</p>
            <p>• 建议值：通勤 22-26°C，有氧跑 10-14°C，长距离 8-12°C，间歇跑 5-10°C</p>
            <p>• 滑动即保存，无需确认</p>
          </div>
        </div>
      </div>
    </main>
  );
}
