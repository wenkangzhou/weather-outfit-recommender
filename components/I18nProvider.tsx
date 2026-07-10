'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAppStore } from '@/store/appStore';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useAppStore();

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
