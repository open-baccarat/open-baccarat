// ============================================
// OpenBaccarat - i18n 请求配置
// ============================================

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  // 默认使用英语，实际语言在客户端检测后由 Provider 处理
  const locale: Locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
