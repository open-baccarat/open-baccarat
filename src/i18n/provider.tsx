// ============================================
// OpenBaccarat - i18n Provider
// 客户端语言检测和切换
// ============================================

'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getCurrentLocale, setStoredLocale, type Locale } from './config';

// 预加载的消息
import enMessages from '../../messages/en.json';
import zhCNMessages from '../../messages/zh-CN.json';

const messages: Record<Locale, typeof enMessages> = {
  'en': enMessages,
  'zh-CN': zhCNMessages,
};

// 语言上下文
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

// Provider 组件
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端初始化时检测语言
  useEffect(() => {
    const detectedLocale = getCurrentLocale();
    setLocaleState(detectedLocale);
    setIsHydrated(true);
  }, []);

  // 切换语言的函数
  const setLocale = useCallback((newLocale: Locale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
    
    // 更新 HTML lang 属性
    document.documentElement.lang = newLocale === 'zh-CN' ? 'zh-CN' : 'en';
  }, []);

  // 更新 HTML lang 属性
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';
    }
  }, [locale, isHydrated]);

  // 在 hydration 前使用英语避免 mismatch
  const currentMessages = messages[locale] || messages['en'];

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider 
        locale={locale} 
        messages={currentMessages}
        timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
