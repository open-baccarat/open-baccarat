// ============================================
// OpenBaccarat - 游戏规则单元测试
// ============================================

import { describe, it, expect } from 'vitest';
import {
  getCardValue,
  calculateHandTotal,
  isNatural,
  shouldPlayerDraw,
  shouldBankerDraw,
  determineResult,
  isPair,
  calculateBurnCount,
  simulateRound,
  verifyRound,
} from '@/lib/game/rules';
import type { Card } from '@/types';

describe('getCardValue', () => {
  it('应该正确返回数字牌的点数', () => {
    expect(getCardValue('A')).toBe(1);
    expect(getCardValue('2')).toBe(2);
    expect(getCardValue('3')).toBe(3);
    expect(getCardValue('4')).toBe(4);
    expect(getCardValue('5')).toBe(5);
    expect(getCardValue('6')).toBe(6);
    expect(getCardValue('7')).toBe(7);
    expect(getCardValue('8')).toBe(8);
    expect(getCardValue('9')).toBe(9);
  });

  it('应该正确返回10和花牌的点数（0点）', () => {
    expect(getCardValue('10')).toBe(0);
    expect(getCardValue('J')).toBe(0);
    expect(getCardValue('Q')).toBe(0);
    expect(getCardValue('K')).toBe(0);
  });
});

describe('calculateHandTotal', () => {
  it('应该正确计算两张牌的总点数', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '7' },
      { suit: 'spade', rank: '5' },
    ];
    expect(calculateHandTotal(cards)).toBe(2); // 12 % 10 = 2
  });

  it('应该正确处理包含花牌的情况', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: 'K' },
      { suit: 'spade', rank: '9' },
    ];
    expect(calculateHandTotal(cards)).toBe(9); // 0 + 9 = 9
  });

  it('应该正确计算三张牌的总点数', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '5' },
      { suit: 'diamond', rank: '3' },
    ];
    expect(calculateHandTotal(cards)).toBe(2); // 12 % 10 = 2
  });

  it('应该处理空数组', () => {
    expect(calculateHandTotal([])).toBe(0);
  });

  it('应该正确处理天牌（8点或9点）', () => {
    const cards1: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '4' },
    ];
    expect(calculateHandTotal(cards1)).toBe(8);

    const cards2: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '5' },
    ];
    expect(calculateHandTotal(cards2)).toBe(9);
  });
});

describe('isNatural', () => {
  it('应该正确识别天牌（8点）', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '4' },
    ];
    expect(isNatural(cards)).toBe(true);
  });

  it('应该正确识别天牌（9点）', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '5' },
    ];
    expect(isNatural(cards)).toBe(true);
  });

  it('应该正确识别非天牌', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '3' },
      { suit: 'spade', rank: '4' },
    ];
    expect(isNatural(cards)).toBe(false);
  });

  it('只有一张牌时不是天牌', () => {
    const cards: Card[] = [{ suit: 'heart', rank: '9' }];
    expect(isNatural(cards)).toBe(false);
  });
});

describe('shouldPlayerDraw', () => {
  it('闲家0-5点应该补牌', () => {
    const testCases = [
      [{ suit: 'heart' as const, rank: 'K' as const }, { suit: 'spade' as const, rank: 'K' as const }], // 0点
      [{ suit: 'heart' as const, rank: 'A' as const }, { suit: 'spade' as const, rank: 'K' as const }], // 1点
      [{ suit: 'heart' as const, rank: '2' as const }, { suit: 'spade' as const, rank: 'K' as const }], // 2点
      [{ suit: 'heart' as const, rank: '3' as const }, { suit: 'spade' as const, rank: 'K' as const }], // 3点
      [{ suit: 'heart' as const, rank: '4' as const }, { suit: 'spade' as const, rank: 'K' as const }], // 4点
      [{ suit: 'heart' as const, rank: '5' as const }, { suit: 'spade' as const, rank: 'K' as const }], // 5点
    ];

    testCases.forEach((cards) => {
      expect(shouldPlayerDraw(cards)).toBe(true);
    });
  });

  it('闲家6-7点不应该补牌', () => {
    const cards6: Card[] = [
      { suit: 'heart', rank: '6' },
      { suit: 'spade', rank: 'K' },
    ];
    expect(shouldPlayerDraw(cards6)).toBe(false);

    const cards7: Card[] = [
      { suit: 'heart', rank: '7' },
      { suit: 'spade', rank: 'K' },
    ];
    expect(shouldPlayerDraw(cards7)).toBe(false);
  });

  it('非两张牌不补牌', () => {
    const oneCard: Card[] = [{ suit: 'heart', rank: '3' }];
    expect(shouldPlayerDraw(oneCard)).toBe(false);

    const threeCards: Card[] = [
      { suit: 'heart', rank: '3' },
      { suit: 'spade', rank: '2' },
      { suit: 'diamond', rank: 'A' },
    ];
    expect(shouldPlayerDraw(threeCards)).toBe(false);
  });
});

describe('shouldBankerDraw', () => {
  describe('闲家不补牌时', () => {
    it('庄家0-5点应该补牌', () => {
      // 0点: K + K = 0
      expect(shouldBankerDraw([{ suit: 'heart', rank: 'K' }, { suit: 'spade', rank: 'K' }], null)).toBe(true);
      // 1点: A + K = 1
      expect(shouldBankerDraw([{ suit: 'heart', rank: 'A' }, { suit: 'spade', rank: 'K' }], null)).toBe(true);
      // 2点: 2 + K = 2
      expect(shouldBankerDraw([{ suit: 'heart', rank: '2' }, { suit: 'spade', rank: 'K' }], null)).toBe(true);
      // 3点: 3 + K = 3
      expect(shouldBankerDraw([{ suit: 'heart', rank: '3' }, { suit: 'spade', rank: 'K' }], null)).toBe(true);
      // 4点: 4 + K = 4
      expect(shouldBankerDraw([{ suit: 'heart', rank: '4' }, { suit: 'spade', rank: 'K' }], null)).toBe(true);
      // 5点: 5 + K = 5
      expect(shouldBankerDraw([{ suit: 'heart', rank: '5' }, { suit: 'spade', rank: 'K' }], null)).toBe(true);
    });

    it('庄家6-7点不应该补牌', () => {
      const cards6: Card[] = [
        { suit: 'heart', rank: '6' },
        { suit: 'spade', rank: 'K' },
      ];
      expect(shouldBankerDraw(cards6, null)).toBe(false);

      const cards7: Card[] = [
        { suit: 'heart', rank: '7' },
        { suit: 'spade', rank: 'K' },
      ];
      expect(shouldBankerDraw(cards7, null)).toBe(false);
    });
  });

  describe('闲家补牌时', () => {
    it('庄家0-2点总是补牌', () => {
      // 0点: K + K = 0
      expect(shouldBankerDraw([{ suit: 'heart', rank: 'K' }, { suit: 'spade', rank: 'K' }], { suit: 'diamond', rank: '5' })).toBe(true);
      // 1点: A + K = 1
      expect(shouldBankerDraw([{ suit: 'heart', rank: 'A' }, { suit: 'spade', rank: 'K' }], { suit: 'diamond', rank: '5' })).toBe(true);
      // 2点: 2 + K = 2
      expect(shouldBankerDraw([{ suit: 'heart', rank: '2' }, { suit: 'spade', rank: 'K' }], { suit: 'diamond', rank: '5' })).toBe(true);
    });

    it('庄家3点 - 闲家第三张不是8时补牌', () => {
      const bankerCards: Card[] = [
        { suit: 'heart', rank: '3' },
        { suit: 'spade', rank: 'K' },
      ];

      // 闲家第三张是8，不补牌
      expect(shouldBankerDraw(bankerCards, { suit: 'diamond', rank: '8' })).toBe(false);

      // 闲家第三张不是8，补牌
      expect(shouldBankerDraw(bankerCards, { suit: 'diamond', rank: '7' })).toBe(true);
      expect(shouldBankerDraw(bankerCards, { suit: 'diamond', rank: '9' })).toBe(true);
    });

    it('庄家7点不补牌', () => {
      const bankerCards: Card[] = [
        { suit: 'heart', rank: '7' },
        { suit: 'spade', rank: 'K' },
      ];
      const playerThirdCard: Card = { suit: 'diamond', rank: '5' };
      expect(shouldBankerDraw(bankerCards, playerThirdCard)).toBe(false);
    });
  });
});

describe('determineResult', () => {
  it('闲家点数高于庄家时，闲赢', () => {
    expect(determineResult(9, 7)).toBe('player_win');
    expect(determineResult(8, 5)).toBe('player_win');
    expect(determineResult(1, 0)).toBe('player_win');
  });

  it('庄家点数高于闲家时，庄赢', () => {
    expect(determineResult(7, 9)).toBe('banker_win');
    expect(determineResult(5, 8)).toBe('banker_win');
    expect(determineResult(0, 1)).toBe('banker_win');
  });

  it('点数相同时，和局', () => {
    expect(determineResult(9, 9)).toBe('tie');
    expect(determineResult(0, 0)).toBe('tie');
    expect(determineResult(5, 5)).toBe('tie');
  });
});

describe('isPair', () => {
  it('相同点数为对子', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '7' },
      { suit: 'spade', rank: '7' },
    ];
    expect(isPair(cards)).toBe(true);
  });

  it('不同点数不是对子', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: '7' },
      { suit: 'heart', rank: '8' },
    ];
    expect(isPair(cards)).toBe(false);
  });

  it('花牌对子', () => {
    const cards: Card[] = [
      { suit: 'heart', rank: 'K' },
      { suit: 'spade', rank: 'K' },
    ];
    expect(isPair(cards)).toBe(true);
  });

  it('只有一张牌不是对子', () => {
    const cards: Card[] = [{ suit: 'heart', rank: '7' }];
    expect(isPair(cards)).toBe(false);
  });
});

describe('calculateBurnCount', () => {
  it('应该根据第一张牌点数计算烧牌数', () => {
    expect(calculateBurnCount('A')).toBe(1);
    expect(calculateBurnCount('2')).toBe(2);
    expect(calculateBurnCount('9')).toBe(9);
  });

  it('10点和花牌应该烧10张', () => {
    expect(calculateBurnCount('10')).toBe(10);
    expect(calculateBurnCount('J')).toBe(10);
    expect(calculateBurnCount('Q')).toBe(10);
    expect(calculateBurnCount('K')).toBe(10);
  });
});

describe('simulateRound', () => {
  it('应该模拟完整的一局游戏', () => {
    const deck: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '5' },
      { suit: 'diamond', rank: '3' },
      { suit: 'club', rank: '2' },
      { suit: 'heart', rank: '6' },
      { suit: 'spade', rank: '7' },
    ];

    const result = simulateRound(deck);

    expect(result.playerCards.length).toBeGreaterThanOrEqual(2);
    expect(result.bankerCards.length).toBeGreaterThanOrEqual(2);
    expect(['banker_win', 'player_win', 'tie']).toContain(result.result);
    expect(result.cardsUsed).toBeGreaterThanOrEqual(4);
  });

  it('天牌时不补牌', () => {
    const deck: Card[] = [
      { suit: 'heart', rank: '4' },  // 闲1
      { suit: 'spade', rank: 'K' },   // 庄1
      { suit: 'diamond', rank: '5' }, // 闲2 - 总计9点，天牌
      { suit: 'club', rank: '8' },    // 庄2
      { suit: 'heart', rank: '6' },   // 不应该发到
      { suit: 'spade', rank: '7' },
    ];

    const result = simulateRound(deck);

    expect(result.playerCards).toHaveLength(2);
    expect(result.bankerCards).toHaveLength(2);
    expect(result.cardsUsed).toBe(4);
  });
});

describe('verifyRound', () => {
  it('应该正确验证游戏结果', () => {
    const playerCards: Card[] = [
      { suit: 'heart', rank: '4' },
      { suit: 'spade', rank: '5' },
    ];
    const bankerCards: Card[] = [
      { suit: 'diamond', rank: '3' },
      { suit: 'club', rank: '4' },
    ];

    expect(verifyRound(playerCards, bankerCards, 'player_win')).toBe(true);
    expect(verifyRound(playerCards, bankerCards, 'banker_win')).toBe(false);
  });
});
