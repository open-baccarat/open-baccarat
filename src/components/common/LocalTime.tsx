// ============================================
// OpenBaccarat - 本地时间显示组件
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { formatShortTime, formatLocalTime, formatDate, getUserTimezone, getTimezoneOffset } from '@/lib/utils/time';

interface LocalTimeProps {
  className?: string;
  showDate?: boolean;
  showTimezone?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LocalTime({ 
  className = '', 
  showDate = false, 
  showTimezone = false,
  size = 'md' 
}: LocalTimeProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(formatShortTime(now));
      setDate(formatDate(now));
    };

    setTimezone(getUserTimezone());
    setOffset(getTimezoneOffset());
    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showDate && (
        <span className="text-xs text-zinc-500">{date}</span>
      )}
      <span className={`font-mono tabular-nums text-white ${sizeClasses[size]}`}>
        {time}
      </span>
      {showTimezone && (
        <span className="text-xs text-zinc-500">
          {timezone} (UTC{offset >= 0 ? '+' : ''}{offset})
        </span>
      )}
    </div>
  );
}

interface TimestampDisplayProps {
  timestamp: Date | number | string;
  format?: 'full' | 'short' | 'relative';
  className?: string;
}

export function TimestampDisplay({ 
  timestamp, 
  format = 'full', 
  className = '' 
}: TimestampDisplayProps) {
  const [displayTime, setDisplayTime] = useState<string>('');

  useEffect(() => {
    const d = new Date(timestamp);
    switch (format) {
      case 'short':
        setDisplayTime(formatShortTime(d));
        break;
      case 'full':
      default:
        setDisplayTime(formatLocalTime(d));
        break;
    }
  }, [timestamp, format]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {displayTime}
    </span>
  );
}
