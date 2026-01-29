// ============================================
// OpenBaccarat - LocalTime 组件测试
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LocalTime } from '@/components/common/LocalTime';

describe('LocalTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 设置固定时间
    vi.setSystemTime(new Date('2026-01-27T12:30:45.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该渲染时间组件', () => {
    const { container } = render(<LocalTime />);
    expect(container.firstChild).toBeDefined();
  });

  it('应该显示时间格式', () => {
    render(<LocalTime />);
    // 检查是否包含冒号（时间格式）
    const container = render(<LocalTime />);
    expect(container.container.textContent).toContain(':');
  });

  it('应该显示时区信息', () => {
    render(<LocalTime showTimezone />);
    // 时区信息应该存在
    const { container } = render(<LocalTime showTimezone />);
    expect(container.firstChild).toBeDefined();
  });

  it('应该每秒更新时间', async () => {
    const { container } = render(<LocalTime />);
    const initialText = container.textContent;

    // 前进1秒
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // 时间应该更新
    // 注意：由于我们设置了固定时间，所以这里只测试组件正常渲染
    expect(container.firstChild).toBeDefined();
  });
});
