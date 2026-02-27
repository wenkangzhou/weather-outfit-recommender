'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Shirt, History, ChevronRight, Timer, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { UserPreferences, RunType } from '@/types';
import { getUserPreferences, saveUserPreferences, getClothingItems, getOutfitHistory } from '@/lib/supabase';
import { Card } from '@/components/ui/card';

const RUN_TYPE_OPTIONS: { type: RunType; label: string }[] = [
  { type: 'easy', label: '有氧跑' },
  { type: 'long', label: '长距离' },
  { type: 'interval', label: '间歇跑' },
];

export default function SettingsTab() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [defaultRunType, setDefaultRunType] = useState<RunType>('easy');
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [showRunTypePicker, setShowRunTypePicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load preferences and counts
  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadData = async () => {
    const prefs = await getUserPreferences();
    if (prefs) {
      setPreferences(prefs);
      setDefaultRunType(prefs.defaultRunType || 'easy');
    }
    const items = await getClothingItems();
    setWardrobeCount(items.length);
    const history = await getOutfitHistory();
    setHistoryCount(history.length);
  };

  // Auto-save when run type changes
  const handleRunTypeChange = useCallback(async (type: RunType) => {
    setDefaultRunType(type);
    if (preferences) {
      const newPrefs: UserPreferences = {
        ...preferences,
        defaultRunType: type,
      };
      await saveUserPreferences(newPrefs);
      setPreferences(newPrefs);
    }
    setShowRunTypePicker(false);
  }, [preferences]);

  if (!mounted) {
    return (
      <div className="min-h-screen pb-28">
        <header className="pt-12 pb-6 px-5">
          <h1 className="text-[28px] font-semibold tracking-tight">{t('settings.title')}</h1>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      {/* Header */}
      <header className="pt-12 pb-6 px-5">
        <h1 className="text-[28px] font-semibold tracking-tight">{t('settings.title')}</h1>
      </header>

      <div className="px-5 space-y-6">
        {/* Quick Access - Full Width */}
        <section className="space-y-3">
          <QuickAccessRow 
            icon={<Shirt size={20} />}
            title={t('settings.myWardrobe')}
            count={wardrobeCount}
            unit={t('settings.items')}
            onClick={() => router.push('/wardrobe?from=settings')}
          />
          <QuickAccessRow 
            icon={<History size={20} />}
            title={t('settings.outfitHistory')}
            count={historyCount}
            unit={t('settings.records')}
            onClick={() => router.push('/history')}
          />
        </section>

        {/* Appearance */}
        <section>
          <div className="settings-section-title">
            <Sun size={16} className="text-amber-500" />
            {t('settings.appearance')}
          </div>
          
          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.theme')}</div>
            <div className="options-row">
              <OptionButton 
                icon={<Monitor size={18} />}
                label={t('settings.system')}
                active={theme === 'system'}
                onClick={() => setTheme('system')}
              />
              <OptionButton 
                icon={<Sun size={18} />}
                label={t('settings.light')}
                active={theme === 'light'}
                onClick={() => setTheme('light')}
              />
              <OptionButton 
                icon={<Moon size={18} />}
                label={t('settings.dark')}
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />
            </div>
          </Card>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.language')}</div>
            <div className="options-row">
              <LangButton 
                label="中文"
                active={language === 'zh'}
                onClick={() => {
                  setLanguage('zh');
                  i18n.changeLanguage('zh');
                }}
              />
              <LangButton 
                label="English"
                active={language === 'en'}
                onClick={() => {
                  setLanguage('en');
                  i18n.changeLanguage('en');
                }}
              />
            </div>
          </Card>
        </section>

        <div className="h-4" />
      </div>

      {/* Run Type Picker Modal */}
      {showRunTypePicker && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-end justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">选择默认课表</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowRunTypePicker(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className="p-3 space-y-2">
              {RUN_TYPE_OPTIONS.map((run) => (
                <button
                  key={run.type}
                  onClick={() => handleRunTypeChange(run.type)}
                  className={`w-full p-4 flex items-center justify-between rounded-xl transition-colors ${
                    defaultRunType === run.type 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      defaultRunType === run.type 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Timer size={18} />
                    </div>
                    <div className="font-medium">{run.label}</div>
                  </div>
                  {defaultRunType === run.type && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check size={14} className="text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ========== Components ==========

function QuickAccessRow({ icon, title, count, unit, onClick }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  unit: string;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-border/80 hover:bg-accent transition-all active:scale-[0.99]"
    >
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{title}</div>
        <div className="text-base font-medium tabular-nums">
          {count} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </button>
  );
}

function OptionButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`option-button ${active ? 'active' : ''}`}
    >
      <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function LangButton({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`option-button ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  );
}


