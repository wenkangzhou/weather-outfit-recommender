'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zh from './locales/zh.json';
import en from './locales/en.json';

const resources = {
  zh: { translation: zh },
  en: { translation: en },
};

// 只在客户端初始化
if (typeof window !== 'undefined') {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'zh',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
