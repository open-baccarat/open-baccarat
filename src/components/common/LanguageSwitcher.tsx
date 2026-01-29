// ============================================
// OpenBaccarat - 语言切换器组件
// ============================================

'use client';

import { useLocale } from '@/i18n/provider';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'button' | 'select';
  className?: string;
}

export function LanguageSwitcher({ variant = 'button', className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  if (variant === 'select') {
    return (
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger className={cn('w-28 bg-zinc-800 border-zinc-700 text-sm', className)}>
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeNames[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // 简单的按钮切换模式
  const nextLocale: Locale = locale === 'en' ? 'zh-CN' : 'en';
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      className={cn(
        'text-zinc-400 hover:text-white hover:bg-zinc-800 px-2',
        className
      )}
      title={`Switch to ${localeNames[nextLocale]}`}
    >
      <span className="text-base mr-1">🌐</span>
      <span className="text-xs font-medium">{locale === 'en' ? '中' : 'EN'}</span>
    </Button>
  );
}
