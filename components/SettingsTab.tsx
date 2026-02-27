'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Shirt, History, ChevronRight, Plus, X, Zap, Route, Timer } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { UserPreferences, ClothingItem, RunType } from '@/types';
import { getUserPreferences, saveUserPreferences, getClothingItems } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type SettingsView = 'main' | 'wardrobe' | 'history';

const RUN_TYPES: { type: RunType; icon: React.ReactNode; label: string; desc: string }[] = [
  { type: 'easy', icon: <Zap size={18} />, label: '有氧跑', desc: '心率低、出汗少，可适当保暖' },
  { type: 'long', icon: <Route size={18} />, label: '长距离', desc: '需携带补给，选有口袋的裤子' },
  { type: 'interval', icon: <Timer size={18} />, label: '间歇跑', desc: '速度快、出汗多，体育场可备外套' },
];

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [defaultRunType, setDefaultRunType] = useState<RunType>('easy');
  const [wardrobeCount, setWardrobeCount] = useState(0);

  // Load preferences
  useEffect(() => {
    getUserPreferences().then(prefs => {
      if (prefs) {
        setPreferences(prefs);
        setDefaultRunType(prefs.defaultRunType || 'easy');
      }
    });
    getClothingItems().then(items => setWardrobeCount(items.length));
  }, []);

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
  }, [preferences]);

  // Auto-save when theme changes
  const handleThemeChange = useCallback(async (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    if (preferences) {
      const newPrefs: UserPreferences = {
        ...preferences,
        id: preferences.id || 'default',
        location: preferences.location || '上海',
        defaultRunType,
      };
      // Note: theme is stored in appStore, not user preferences
    }
  }, [preferences, defaultRunType, setTheme]);

  // Auto-save when language changes
  const handleLanguageChange = useCallback(async (lang: 'zh' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    if (preferences) {
      const newPrefs: UserPreferences = {
        ...preferences,
        id: preferences.id || 'default',
        location: preferences.location || '上海',
        defaultRunType,
      };
      // Note: language is stored in appStore, not user preferences
    }
  }, [preferences, defaultRunType, setLanguage, i18n]);

  if (currentView === 'wardrobe') {
    return <WardrobeView onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'history') {
    return <HistoryView onBack={() => setCurrentView('main')} />;
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
            onClick={() => setCurrentView('wardrobe')}
          />
          <QuickAccessRow 
            icon={<History size={20} />}
            title={t('settings.outfitHistory')}
            count={0}
            unit={t('settings.records')}
            onClick={() => setCurrentView('history')}
          />
        </section>

        {/* Running Type */}
        <section>
          <div className="settings-section-title">
            <Timer size={16} className="text-blue-500" />
            跑步课表
          </div>
          
          <div className="space-y-3">
            {RUN_TYPES.map((run) => (
              <RunTypeCard
                key={run.type}
                type={run.type}
                icon={run.icon}
                label={run.label}
                desc={run.desc}
                active={defaultRunType === run.type}
                onClick={() => handleRunTypeChange(run.type)}
              />
            ))}
          </div>
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
                onClick={() => handleThemeChange('system')}
              />
              <OptionButton 
                icon={<Sun size={18} />}
                label={t('settings.light')}
                active={theme === 'light'}
                onClick={() => handleThemeChange('light')}
              />
              <OptionButton 
                icon={<Moon size={18} />}
                label={t('settings.dark')}
                active={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
              />
            </div>
          </Card>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.language')}</div>
            <div className="options-row">
              <LangButton 
                label="中文"
                active={language === 'zh'}
                onClick={() => handleLanguageChange('zh')}
              />
              <LangButton 
                label="English"
                active={language === 'en'}
                onClick={() => handleLanguageChange('en')}
              />
            </div>
          </Card>
        </section>

        <div className="h-4" />
      </div>
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

function RunTypeCard({ type, icon, label, desc, active, onClick }: {
  type: RunType;
  icon: React.ReactNode;
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
        active 
          ? 'bg-primary/5 border-primary' 
          : 'bg-card border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium mb-1 ${active ? 'text-primary' : ''}`}>{label}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          active ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        }`}>
          {active && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
        </div>
      </div>
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

// ========== Sub Views ==========

function WardrobeView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClothingItems().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen pb-24 animate-slide-up">
      <header className="pt-12 pb-6 px-5 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <X size={20} />
        </Button>
        <h1 className="text-xl font-semibold">{t('settings.myWardrobe')}</h1>
        <div className="flex-1" />
        <Button size="icon" className="rounded-full bg-primary">
          <Plus size={20} />
        </Button>
      </header>

      <div className="px-5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              👕
            </div>
            <p className="text-muted-foreground">{t('outfit.emptyWardrobe')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <Card key={item.id} className="p-3 border-border/50">
                <div className="aspect-square rounded-xl bg-muted flex items-center justify-center text-3xl mb-3">
                  {item.category === 'top' ? '👕' : 
                   item.category === 'bottom' ? '👖' : 
                   item.category === 'socks' ? '🧦' : '👟'}
                </div>
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">{t(`types.${item.subCategory}`)}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-24 animate-slide-up">
      <header className="pt-12 pb-6 px-5 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <X size={20} />
        </Button>
        <h1 className="text-xl font-semibold">{t('settings.outfitHistory')}</h1>
      </header>

      <div className="px-5">
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-3xl">
            📋
          </div>
          <p className="text-muted-foreground">{t('status.noHistory')}</p>
        </div>
      </div>
    </div>
  );
}
