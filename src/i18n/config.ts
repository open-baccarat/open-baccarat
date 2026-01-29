// ============================================
// OpenBaccarat - i18n 配置
// ============================================

export const locales = ['en', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// 语言显示名称
export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
};

// 检测浏览器语言，如果是中文则返回 zh-CN，否则返回 en
export function detectLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
  
  // 检查是否是简体中文
  if (browserLang.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }
  
  return 'en';
}

// 获取本地存储的语言偏好
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const stored = localStorage.getItem('locale');
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  
  return null;
}

// 保存语言偏好到本地存储
export function setStoredLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

// 获取当前应该使用的语言
export function getCurrentLocale(): Locale {
  // 优先使用用户存储的偏好
  const stored = getStoredLocale();
  if (stored) {
    return stored;
  }
  
  // 否则检测浏览器语言
  return detectLocale();
}
