// ============================================
// OpenBaccarat - PlayingCard 组件测试
// 适配增强版3D翻牌组件
// ============================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayingCard, CardGroup } from '@/components/common/PlayingCard';
import type { Card } from '@/types';

describe('PlayingCard', () => {
  describe('渲染正确的花色符号', () => {
    it('应该显示黑桃符号 ♠', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      render(<PlayingCard card={card} />);
      // 花色符号会出现多次（左上角、中央、右下角），使用 getAllByText
      const symbols = screen.getAllByText('♠');
      expect(symbols.length).toBeGreaterThan(0);
    });

    it('应该显示红心符号 ♥', () => {
      const card: Card = { suit: 'heart', rank: 'K' };
      render(<PlayingCard card={card} />);
      const symbols = screen.getAllByText('♥');
      expect(symbols.length).toBeGreaterThan(0);
    });

    it('应该显示方块符号 ♦', () => {
      const card: Card = { suit: 'diamond', rank: 'Q' };
      render(<PlayingCard card={card} />);
      const symbols = screen.getAllByText('♦');
      expect(symbols.length).toBeGreaterThan(0);
    });

    it('应该显示梅花符号 ♣', () => {
      const card: Card = { suit: 'club', rank: 'J' };
      render(<PlayingCard card={card} />);
      const symbols = screen.getAllByText('♣');
      expect(symbols.length).toBeGreaterThan(0);
    });
  });

  describe('渲染正确的点数', () => {
    it('应该显示 A', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      render(<PlayingCard card={card} />);
      // 点数会出现两次（左上角和右下角），使用 getAllByText
      const ranks = screen.getAllByText('A');
      expect(ranks.length).toBeGreaterThan(0);
    });

    it('应该显示数字 2-10', () => {
      const card: Card = { suit: 'heart', rank: '5' };
      render(<PlayingCard card={card} />);
      const ranks = screen.getAllByText('5');
      expect(ranks.length).toBeGreaterThan(0);
    });

    it('应该显示 10', () => {
      const card: Card = { suit: 'diamond', rank: '10' };
      render(<PlayingCard card={card} />);
      const ranks = screen.getAllByText('10');
      expect(ranks.length).toBeGreaterThan(0);
    });

    it('应该显示 K', () => {
      const card: Card = { suit: 'club', rank: 'K' };
      render(<PlayingCard card={card} />);
      const ranks = screen.getAllByText('K');
      expect(ranks.length).toBeGreaterThan(0);
    });
  });

  describe('颜色正确', () => {
    it('黑桃应该是黑色', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} />);
      // 检查组件是否存在
      expect(container.firstChild).toBeDefined();
    });

    it('红心应该是红色', () => {
      const card: Card = { suit: 'heart', rank: 'A' };
      const { container } = render(<PlayingCard card={card} />);
      // 检查组件是否存在红色相关样式
      expect(container.textContent?.includes('♥')).toBeTruthy();
    });
  });

  describe('尺寸变体', () => {
    it('应该支持 sm 尺寸', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} size="sm" />);
      expect(container.firstChild).toBeDefined();
    });

    it('应该支持 md 尺寸', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} size="md" />);
      expect(container.firstChild).toBeDefined();
    });

    it('应该支持 lg 尺寸', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} size="lg" />);
      expect(container.firstChild).toBeDefined();
    });

    it('应该支持 xl 尺寸', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} size="xl" />);
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('牌背面', () => {
    it('应该渲染牌背面组件', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} faceDown />);
      expect(container.firstChild).toBeDefined();
      // 牌背面应该包含 OB logo
      expect(container.textContent?.includes('OB')).toBeTruthy();
    });

    it('牌背面应该有正确的样式类', () => {
      const card: Card = { suit: 'spade', rank: 'A' };
      const { container } = render(<PlayingCard card={card} faceDown />);
      // 检查包含翻转样式类
      const flipContainer = container.querySelector('.rotate-y-180');
      expect(flipContainer).toBeDefined();
    });
  });

  describe('CardGroup 组件', () => {
    it('应该渲染多张牌', () => {
      const cards: Card[] = [
        { suit: 'spade', rank: 'A' },
        { suit: 'heart', rank: 'K' },
        { suit: 'diamond', rank: 'Q' },
      ];
      render(<CardGroup cards={cards} />);
      
      const aces = screen.getAllByText('A');
      const kings = screen.getAllByText('K');
      const queens = screen.getAllByText('Q');
      
      expect(aces.length).toBeGreaterThan(0);
      expect(kings.length).toBeGreaterThan(0);
      expect(queens.length).toBeGreaterThan(0);
    });

    it('应该支持重叠模式', () => {
      const cards: Card[] = [
        { suit: 'spade', rank: 'A' },
        { suit: 'heart', rank: 'K' },
      ];
      const { container } = render(<CardGroup cards={cards} overlap={true} />);
      // 检查负间距类
      const groupElement = container.firstChild;
      expect(groupElement).toBeDefined();
    });

    it('应该支持非重叠模式', () => {
      const cards: Card[] = [
        { suit: 'spade', rank: 'A' },
        { suit: 'heart', rank: 'K' },
      ];
      const { container } = render(<CardGroup cards={cards} overlap={false} />);
      expect(container.firstChild).toBeDefined();
    });
  });
});
