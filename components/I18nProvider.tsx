'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAppStore } from '@/store/appStore';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useAppStore();

  useEffect(() => {
    if (i18n.isInitialized) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // 等待 i18n 初始化
  if (!i18n.isInitialized) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
