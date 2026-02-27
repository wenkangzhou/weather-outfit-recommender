'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Thermometer, MapPin, Shirt, History, ChevronRight, Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { UserPreferences, ClothingItem } from '@/types';
import { getUserPreferences, saveUserPreferences, getClothingItems } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type SettingsView = 'main' | 'wardrobe' | 'history';

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [location, setLocation] = useState('');
  const [commuteDistance, setCommuteDistance] = useState(5);
  const [runDistance, setRunDistance] = useState(5);
  const [coldSensitivity, setColdSensitivity] = useState(3);
  const [hotSensitivity, setHotSensitivity] = useState(3);
  const [sweatLevel, setSweatLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [windSensitivity, setWindSensitivity] = useState(false);
  const [rainPreference, setRainPreference] = useState<'avoid' | 'ok' | 'like'>('avoid');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUserPreferences().then(prefs => {
      if (prefs) {
        setPreferences(prefs);
        setLocation(prefs.location || '');
        setCommuteDistance(prefs.commuteDistance || 5);
        setRunDistance(prefs.runDistance || 5);
        setColdSensitivity(prefs.coldSensitivity || 3);
        setHotSensitivity(prefs.hotSensitivity || 3);
        setSweatLevel(prefs.sweatLevel || 'medium');
        setWindSensitivity(prefs.windSensitivity || false);
        setRainPreference(prefs.rainPreference || 'avoid');
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const newPrefs: UserPreferences = {
        ...preferences,
        id: preferences?.id || 'default',
        location,
        commuteDistance,
        runDistance,
        coldSensitivity,
        hotSensitivity,
        sweatLevel,
        windSensitivity,
        rainPreference,
      };
      await saveUserPreferences(newPrefs);
      setPreferences(newPrefs);
    } finally {
      setSaving(false);
    }
  }, [preferences, location, commuteDistance, runDistance, coldSensitivity, hotSensitivity, sweatLevel, windSensitivity, rainPreference]);

  const handleLanguageChange = (lang: 'zh' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

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
        {/* Quick Access */}
        <section>
          <div className="quick-access-grid">
            <QuickAccessCard 
              icon={<Shirt size={22} />}
              title={t('settings.myWardrobe')}
              count={0}
              unit={t('settings.items')}
              color="bg-amber-500"
              onClick={() => setCurrentView('wardrobe')}
            />
            <QuickAccessCard 
              icon={<History size={22} />}
              title={t('settings.outfitHistory')}
              count={0}
              unit={t('settings.records')}
              color="bg-emerald-500"
              onClick={() => setCurrentView('history')}
            />
          </div>
        </section>

        {/* Appearance */}
        <section>
          <div className="settings-section-title">
            <Sun size={16} className="text-amber-400" />
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

        {/* Basic Settings */}
        <section>
          <div className="settings-section-title">
            <MapPin size={16} className="text-emerald-400" />
            {t('settings.basic')}
          </div>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.location')}</div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('settings.enterLocation')}
              className="input-field"
            />
          </Card>

          <Card className="settings-card">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="settings-card-header">{t('settings.commuteDistance')}</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={commuteDistance}
                    onChange={(e) => setCommuteDistance(Number(e.target.value))}
                    className="input-number"
                  />
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
              </div>
              <div>
                <div className="settings-card-header">{t('settings.runDistance')}</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={runDistance}
                    onChange={(e) => setRunDistance(Number(e.target.value))}
                    className="input-number"
                  />
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Body Preferences */}
        <section>
          <div className="settings-section-title">
            <Thermometer size={16} className="text-rose-400" />
            {t('settings.bodyPreference')}
          </div>

          <Card className="settings-card">
            <div className="flex items-center justify-between mb-4">
              <span className="settings-card-header mb-0">{t('settings.coldSensitive')}</span>
              <span className="text-sm tabular-nums text-muted-foreground">{coldSensitivity}/5</span>
            </div>
            <div className="rating-bar">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setColdSensitivity(v)}
                  className={`rating-button ${coldSensitivity >= v ? 'active' : ''}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Card>

          <Card className="settings-card">
            <div className="flex items-center justify-between mb-4">
              <span className="settings-card-header mb-0">{t('settings.hotSensitive')}</span>
              <span className="text-sm tabular-nums text-muted-foreground">{hotSensitivity}/5</span>
            </div>
            <div className="rating-bar">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setHotSensitivity(v)}
                  className={`rating-button ${hotSensitivity >= v ? 'active' : ''}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Card>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.sweatLevel')}</div>
            <div className="options-row">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSweatLevel(level)}
                  className={`option-button ${sweatLevel === level ? 'active' : ''}`}
                >
                  {t(`settings.sweat_${level}`)}
                </button>
              ))}
            </div>
          </Card>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.windSensitivity')}</div>
            <div className="options-row">
              <button
                onClick={() => setWindSensitivity(false)}
                className={`option-button ${!windSensitivity ? 'active' : ''}`}
              >
                {t('settings.normal')}
              </button>
              <button
                onClick={() => setWindSensitivity(true)}
                className={`option-button ${windSensitivity ? 'active' : ''}`}
              >
                {t('settings.sensitive')}
              </button>
            </div>
          </Card>

          <Card className="settings-card">
            <div className="settings-card-header">{t('settings.rainPreference')}</div>
            <div className="options-row">
              {(['avoid', 'ok', 'like'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setRainPreference(pref)}
                  className={`option-button ${rainPreference === pref ? 'active' : ''}`}
                >
                  {t(`settings.rain_${pref}`)}
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-base font-medium"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            t('settings.save')
          )}
        </Button>

        <div className="h-4" />
      </div>
    </div>
  );
}

// ========== Components ==========

function QuickAccessCard({ icon, title, count, unit, color, onClick }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  unit: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="quick-access-card">
      <div className={`quick-access-icon ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{title}</div>
        <div className="text-lg font-medium tabular-nums">
          {count} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-muted-foreground" />
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
