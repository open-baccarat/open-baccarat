// ============================================
// OpenBaccarat - 加载指示器
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div
        className={cn(
          sizeClasses[size],
          'border-emerald-500 border-t-transparent rounded-full animate-spin'
        )}
      />
      {text && <span className="text-sm text-zinc-500">{text}</span>}
    </div>
  );
}

export function PageLoading() {
  const t = useTranslations('common');
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <LoadingSpinner size="lg" text={t('loading')} />
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="h-48 flex items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  );
}
