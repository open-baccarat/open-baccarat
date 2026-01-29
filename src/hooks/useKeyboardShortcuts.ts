// ============================================
// OpenBaccarat - 键盘快捷键 Hook
// ============================================

'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/game-store';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts() {
  const { 
    historyViewType, 
    setHistoryViewType,
    roadmapViewType,
    setRoadmapViewType,
  } = useGameStore();

  // 定义快捷键
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      action: () => setHistoryViewType('list'),
      description: '切换到列表视图',
    },
    {
      key: '2',
      action: () => setHistoryViewType('roadmap'),
      description: '切换到路单视图',
    },
    {
      key: 'b',
      action: () => setRoadmapViewType('big_road'),
      description: '大路',
    },
    {
      key: 'e',
      action: () => setRoadmapViewType('big_eye_boy'),
      description: '大眼仔',
    },
    {
      key: 's',
      action: () => setRoadmapViewType('small_road'),
      description: '小路',
    },
    {
      key: 'p',
      action: () => setRoadmapViewType('bead_plate'),
      description: '珠盘路',
    },
    {
      key: '?',
      shift: true,
      action: () => showShortcutsHelp(),
      description: '显示快捷键帮助',
    },
  ];

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 忽略输入框中的按键
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const shortcut = shortcuts.find((s) => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = s.alt ? event.altKey : !event.altKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHistoryViewType, setRoadmapViewType]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

/**
 * 显示快捷键帮助
 */
function showShortcutsHelp() {
  const helpText = `
🎹 键盘快捷键

视图切换:
  1 - 列表视图
  2 - 路单视图

路单类型:
  B - 大路
  E - 大眼仔
  S - 小路
  P - 珠盘路

其他:
  Shift + ? - 显示此帮助
  `;
  
  // 使用 alert 或者可以替换为 toast 通知
  alert(helpText);
}

/**
 * 快捷键帮助组件数据
 */
export const KEYBOARD_SHORTCUTS = [
  { keys: ['1'], description: '切换到列表视图' },
  { keys: ['2'], description: '切换到路单视图' },
  { keys: ['B'], description: '大路' },
  { keys: ['E'], description: '大眼仔' },
  { keys: ['S'], description: '小路' },
  { keys: ['P'], description: '珠盘路' },
  { keys: ['Shift', '?'], description: '显示快捷键帮助' },
];

export default useKeyboardShortcuts;
