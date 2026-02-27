'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Thermometer, Wind, Droplets, MapPin, Route } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { UserPreferences } from '@/types';
import { getUserPreferences, saveUserPreferences } from '@/lib/supabase';

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  
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

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="pt-14 pb-6 px-5">
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* ========== 外观设置 ========== */}
        <section className="settings-section">
          <div className="section-header">
            <Sun size={18} className="text-amber-400" />
            <span>{t('settings.appearance')}</span>
          </div>
          
          {/* 主题选择 */}
          <div className="settings-card">
            <div className="settings-card-header">{t('settings.theme')}</div>
            <div className="settings-options-row">
              <ThemeOption 
                icon={<Monitor size={22} />}
                label={t('settings.system')}
                active={theme === 'system'}
                onClick={() => setTheme('system')}
              />
              <ThemeOption 
                icon={<Sun size={22} />}
                label={t('settings.light')}
                active={theme === 'light'}
                onClick={() => setTheme('light')}
              />
              <ThemeOption 
                icon={<Moon size={22} />}
                label={t('settings.dark')}
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />
            </div>
          </div>

          {/* 语言选择 */}
          <div className="settings-card">
            <div className="settings-card-header">{t('settings.language')}</div>
            <div className="settings-options-row">
              <LangOption 
                label="中文"
                active={language === 'zh'}
                onClick={() => handleLanguageChange('zh')}
              />
              <LangOption 
                label="English"
                active={language === 'en'}
                onClick={() => handleLanguageChange('en')}
              />
            </div>
          </div>
        </section>

        {/* ========== 基本设置 ========== */}
        <section className="settings-section">
          <div className="section-header">
            <MapPin size={18} className="text-emerald-400" />
            <span>{t('settings.basic')}</span>
          </div>

          {/* 城市输入 */}
          <div className="settings-card">
            <div className="settings-card-header">{t('settings.location')}</div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('settings.enterLocation')}
              className="settings-input"
            />
          </div>

          {/* 距离设置 */}
          <div className="settings-card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="settings-card-header">{t('settings.commuteDistance')}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commuteDistance}
                    onChange={(e) => setCommuteDistance(Number(e.target.value))}
                    className="settings-input-number"
                  />
                  <span className="text-white/50 text-sm">km</span>
                </div>
              </div>
              <div>
                <div className="settings-card-header">{t('settings.runDistance')}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={runDistance}
                    onChange={(e) => setRunDistance(Number(e.target.value))}
                    className="settings-input-number"
                  />
                  <span className="text-white/50 text-sm">km</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 体感偏好 ========== */}
        <section className="settings-section">
          <div className="section-header">
            <Thermometer size={18} className="text-rose-400" />
            <span>{t('settings.bodyPreference')}</span>
          </div>

          {/* 怕冷程度 */}
          <div className="settings-card">
            <div className="settings-card-header flex justify-between">
              <span>{t('settings.coldSensitive')}</span>
              <span className="text-white/70">{coldSensitivity}/5</span>
            </div>
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setColdSensitivity(v)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                    coldSensitivity >= v 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 怕热程度 */}
          <div className="settings-card">
            <div className="settings-card-header flex justify-between">
              <span>{t('settings.hotSensitive')}</span>
              <span className="text-white/70">{hotSensitivity}/5</span>
            </div>
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setHotSensitivity(v)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                    hotSensitivity >= v 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 出汗程度 */}
          <div className="settings-card">
            <div className="settings-card-header">{t('settings.sweatLevel')}</div>
            <div className="flex gap-2 mt-3">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSweatLevel(level)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                    sweatLevel === level
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {t(`settings.sweat_${level}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 抗风能力 */}
          <div className="settings-card">
            <div className="settings-card-header">{t('settings.windSensitivity')}</div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setWindSensitivity(false)}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                  !windSensitivity
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {t('settings.normal')}
              </button>
              <button
                onClick={() => setWindSensitivity(true)}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                  windSensitivity
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {t('settings.sensitive')}
              </button>
            </div>
          </div>

          {/* 下雨偏好 */}
          <div className="settings-card">
            <div className="settings-card-header">{t('settings.rainPreference')}</div>
            <div className="flex gap-2 mt-3">
              {(['avoid', 'ok', 'like'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setRainPreference(pref)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                    rainPreference === pref
                      ? 'bg-gradient-to-r from-sky-500 to-blue-400 text-white shadow-lg shadow-sky-500/30' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {t(`settings.rain_${pref}`)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="primary-button w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            t('settings.save')
          )}
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}

// 主题选项组件
function ThemeOption({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
        active 
          ? 'bg-white/20 text-white shadow-lg' 
          : 'bg-transparent text-white/50 hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-white' : 'text-white/60'}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// 语言选项组件
function LangOption({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-white text-slate-900 shadow-lg' 
          : 'bg-white/5 text-white/50 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}
