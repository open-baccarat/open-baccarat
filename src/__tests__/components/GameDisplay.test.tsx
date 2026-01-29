// ============================================
// OpenBaccarat - GameDisplay 组件测试
// 适配增强版2D游戏展示
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameDisplay } from '@/components/game/GameDisplay';

// Mock Zustand store
vi.mock('@/stores/game-store', () => ({
  useGameStore: () => ({
    currentShoe: {
      id: 'shoe_1',
      shoeNumber: 1,
      roundsPlayed: 10,
      totalCards: 416,
      usedCards: 50,
    },
    currentRound: {
      id: 'round_42',
      roundNumber: 42,
      result: 'player_win',
      playerCards: [
        { id: '1', suit: 'heart', rank: '7' },
        { id: '2', suit: 'spade', rank: '2' },
      ],
      bankerCards: [
        { id: '3', suit: 'diamond', rank: 'K' },
        { id: '4', suit: 'club', rank: '5' },
        { id: '5', suit: 'heart', rank: '3' },
      ],
      playerTotal: 9,
      bankerTotal: 8,
      isPair: {
        player: false,
        banker: false,
      },
      blockchainStatus: 'confirmed',
      solanaExplorerUrl: 'https://solscan.io/tx/test',
    },
    phase: 'result',
    playerCards: [
      { id: '1', suit: 'heart', rank: '7' },
      { id: '2', suit: 'spade', rank: '2' },
    ],
    bankerCards: [
      { id: '3', suit: 'diamond', rank: 'K' },
      { id: '4', suit: 'club', rank: '5' },
      { id: '5', suit: 'heart', rank: '3' },
    ],
    isAnimating: false,
  }),
}));

describe('GameDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染游戏展示区', () => {
    const { container } = render(<GameDisplay />);
    expect(container.firstChild).toBeDefined();
  });

  it('应该显示庄家标识', () => {
    const { container } = render(<GameDisplay />);
    // 新布局显示 "庄" 和 "Banker" 分开
    expect(
      container.textContent?.includes('庄') || 
      container.textContent?.includes('Banker')
    ).toBeTruthy();
  });

  it('应该显示闲家标识', () => {
    const { container } = render(<GameDisplay />);
    // 新布局显示 "闲" 和 "Player" 分开
    expect(
      container.textContent?.includes('闲') || 
      container.textContent?.includes('Player')
    ).toBeTruthy();
  });

  it('应该显示局号', () => {
    const { container } = render(<GameDisplay />);
    // 检查是否包含局号相关文本
    expect(container.textContent?.includes('#')).toBeTruthy();
  });

  it('应该显示 VS 分隔符', () => {
    const { container } = render(<GameDisplay />);
    expect(container.textContent?.includes('VS')).toBeTruthy();
  });

  it('应该显示倒计时区域', () => {
    const { container } = render(<GameDisplay />);
    expect(container.textContent?.includes('下一局')).toBeTruthy();
  });

  it('应该显示区块链状态', () => {
    const { container } = render(<GameDisplay />);
    expect(container.textContent?.includes('已上链')).toBeTruthy();
  });
});
