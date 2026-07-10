import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zh from './locales/zh.json';
import en from './locales/en.json';

const resources = {
  zh: { translation: zh },
  en: { translation: en },
};

// Inline resources allow synchronous initialization during SSR and on the
// first client render, preventing translation keys from leaking into HTML.
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'zh',
      fallbackLng: 'zh',
      initImmediate: false,
      react: { useSuspense: false },
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
