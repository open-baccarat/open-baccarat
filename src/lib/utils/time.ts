// ============================================
// OpenBaccarat - 时间工具函数
// ============================================

import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化时间戳为本地时间字符串
 */
export function formatLocalTime(date: Date | number | string): string {
  const d = new Date(date);
  return format(d, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
}

/**
 * 格式化时间戳为短格式
 */
export function formatShortTime(date: Date | number | string): string {
  const d = new Date(date);
  return format(d, 'HH:mm:ss', { locale: zhCN });
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
}

/**
 * 格式化相对时间（如 "5分钟前"）
 */
export function formatRelativeTime(date: Date | number | string): string {
  const d = new Date(date);
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

/**
 * Unix 时间戳（毫秒）转 Date
 */
export function unixToDate(unixMs: number): Date {
  return new Date(unixMs);
}

/**
 * Date 转 Unix 时间戳（毫秒）
 */
export function dateToUnix(date: Date): number {
  return date.getTime();
}

/**
 * 获取当前 Unix 时间戳（毫秒）
 */
export function getCurrentUnixTime(): number {
  return Date.now();
}

/**
 * 格式化 Unix 时间戳为本地时间
 */
export function formatUnixTime(unixMs: number): string {
  return formatLocalTime(unixToDate(unixMs));
}

/**
 * 计算两个时间之间的差值（秒）
 */
export function getTimeDifferenceInSeconds(start: Date | number, end: Date | number): number {
  const startTime = typeof start === 'number' ? start : start.getTime();
  const endTime = typeof end === 'number' ? end : end.getTime();
  return Math.floor((endTime - startTime) / 1000);
}

/**
 * 格式化持续时间
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

/**
 * 获取用户时区
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * 获取时区偏移（小时）
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60;
}
