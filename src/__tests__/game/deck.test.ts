// ============================================
// OpenBaccarat - 发牌靴单元测试
// ============================================

import { describe, it, expect } from 'vitest';
import {
  createSingleDeck,
  createShoe,
  shuffleDeck,
  ShoeManager,
  getCardDisplay,
  getCardId,
} from '@/lib/game/deck';
import { DECK_COUNT, CARDS_PER_DECK } from '@/lib/game/constants';

describe('createSingleDeck', () => {
  it('应该创建52张牌', () => {
    const deck = createSingleDeck();
    expect(deck).toHaveLength(52);
  });

  it('应该包含4种花色各13张', () => {
    const deck = createSingleDeck();

    const suits = ['spade', 'heart', 'diamond', 'club'];
    suits.forEach((suit) => {
      const suitCards = deck.filter((card) => card.suit === suit);
      expect(suitCards).toHaveLength(13);
    });
  });

  it('应该包含所有点数', () => {
    const deck = createSingleDeck();
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    ranks.forEach((rank) => {
      const rankCards = deck.filter((card) => card.rank === rank);
      expect(rankCards).toHaveLength(4); // 每个点数4张
    });
  });
});

describe('createShoe', () => {
  it('应该创建8副牌（416张）', () => {
    const shoe = createShoe();
    expect(shoe).toHaveLength(DECK_COUNT * CARDS_PER_DECK);
    expect(shoe).toHaveLength(416);
  });

  it('每个点数应该有32张', () => {
    const shoe = createShoe();
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    ranks.forEach((rank) => {
      const rankCards = shoe.filter((card) => card.rank === rank);
      expect(rankCards).toHaveLength(32); // 8副 * 4种花色 = 32张
    });
  });

  it('可以自定义副数', () => {
    const shoe = createShoe(6);
    expect(shoe).toHaveLength(6 * 52);
  });
});

describe('shuffleDeck', () => {
  it('洗牌后牌数不变', () => {
    const deck = createSingleDeck();
    const shuffled = shuffleDeck([...deck], 'test-seed');
    expect(shuffled).toHaveLength(deck.length);
  });

  it('相同种子产生相同洗牌结果', () => {
    const deck1 = createSingleDeck();
    const deck2 = createSingleDeck();

    const shuffled1 = shuffleDeck([...deck1], 'same-seed');
    const shuffled2 = shuffleDeck([...deck2], 'same-seed');

    expect(shuffled1).toEqual(shuffled2);
  });

  it('不同种子产生不同洗牌结果', () => {
    const deck1 = createSingleDeck();
    const deck2 = createSingleDeck();

    const shuffled1 = shuffleDeck([...deck1], 'seed-1');
    const shuffled2 = shuffleDeck([...deck2], 'seed-2');

    // 极小概率相同，实际不会相同
    expect(shuffled1).not.toEqual(shuffled2);
  });

  it('无种子时使用随机洗牌', () => {
    const deck1 = createSingleDeck();
    const deck2 = createSingleDeck();

    const shuffled1 = shuffleDeck([...deck1]);
    const shuffled2 = shuffleDeck([...deck2]);

    // 随机洗牌，应该不同
    expect(shuffled1).not.toEqual(shuffled2);
  });
});

describe('ShoeManager', () => {
  it('应该正确初始化牌靴', () => {
    const manager = new ShoeManager();
    const info = manager.getInfo();

    expect(info.totalCards).toBe(416);
    expect(info.usedCards).toBe(0);
  });

  it('洗牌后应该重置索引', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');

    const info = manager.getInfo();
    expect(info.usedCards).toBe(0);
  });

  it('应该正确执行开局烧牌', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');

    const burnedCards = manager.performBurn();
    const info = manager.getInfo();

    expect(burnedCards.length).toBeGreaterThan(0);
    expect(info.firstCard).not.toBeNull();
    expect(info.burnStartCount).toBe(burnedCards.length - 1); // 不包含第一张牌本身
  });

  it('应该正确发牌', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');
    manager.performBurn();

    const card = manager.deal();
    expect(card).not.toBeNull();
    expect(card?.suit).toBeDefined();
    expect(card?.rank).toBeDefined();
  });

  it('应该正确发多张牌', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');
    manager.performBurn();

    const cards = manager.dealMultiple(4);
    expect(cards).toHaveLength(4);
  });

  it('应该正确计算剩余牌数', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');
    manager.performBurn();

    const initialRemaining = manager.getRemainingCards();
    manager.deal();
    expect(manager.getRemainingCards()).toBe(initialRemaining - 1);
  });

  it('应该正确判断需要换靴', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');
    manager.performBurn();

    expect(manager.needsReshuffle()).toBe(false);

    // 发掉大部分牌
    while (manager.getRemainingCards() > 5) {
      manager.deal();
    }

    expect(manager.needsReshuffle()).toBe(true);
  });

  it('牌用完后应该返回 null', () => {
    const manager = new ShoeManager();
    manager.shuffle('test-seed');
    manager.performBurn();

    // 发完所有牌
    while (manager.getRemainingCards() > 0) {
      manager.deal();
    }

    expect(manager.deal()).toBeNull();
  });
});

describe('getCardDisplay', () => {
  it('应该正确显示牌', () => {
    expect(getCardDisplay({ suit: 'spade', rank: 'A' })).toBe('♠A');
    expect(getCardDisplay({ suit: 'heart', rank: 'K' })).toBe('♥K');
    expect(getCardDisplay({ suit: 'diamond', rank: '10' })).toBe('♦10');
    expect(getCardDisplay({ suit: 'club', rank: '7' })).toBe('♣7');
  });
});

describe('getCardId', () => {
  it('应该返回唯一标识', () => {
    expect(getCardId({ suit: 'spade', rank: 'A' })).toBe('spade_A');
    expect(getCardId({ suit: 'heart', rank: 'K' })).toBe('heart_K');
  });
});
