// ============================================
// OpenBaccarat - 牌组管理
// ============================================

import type { Card, CardSuit, CardRank } from '@/types';
import { SUITS, RANKS, DECK_COUNT, TOTAL_CARDS, DEFAULT_BURN_END_COUNT } from './constants';
import { calculateBurnCount } from './rules';

/**
 * 创建一副完整的扑克牌（52张）
 */
export function createSingleDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  
  return deck;
}

/**
 * 创建多副牌组成的牌靴
 * @param deckCount 副数，默认8副
 */
export function createShoe(deckCount: number = DECK_COUNT): Card[] {
  const shoe: Card[] = [];
  
  for (let i = 0; i < deckCount; i++) {
    shoe.push(...createSingleDeck());
  }
  
  return shoe;
}

/**
 * Fisher-Yates 洗牌算法
 * 使用可验证的随机数种子
 */
export function shuffleDeck(deck: Card[], seed?: string): Card[] {
  const shuffled = [...deck];
  
  // 简单的伪随机数生成器（用于演示）
  // 生产环境应使用 VRF 提供的随机数
  let random: () => number;
  
  if (seed) {
    // 基于种子的确定性随机
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    let state = Math.abs(hash);
    
    random = () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  } else {
    random = Math.random;
  }
  
  // Fisher-Yates 洗牌
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  
  return shuffled;
}

/**
 * 牌靴管理类
 */
export class ShoeManager {
  private cards: Card[];
  private currentIndex: number;
  private burnStartCount: number;
  private burnEndCount: number;
  private firstCard: Card | null;
  
  constructor(deckCount: number = DECK_COUNT) {
    this.cards = createShoe(deckCount);
    this.currentIndex = 0;
    this.burnStartCount = 0;
    this.burnEndCount = DEFAULT_BURN_END_COUNT;
    this.firstCard = null;
  }
  
  /**
   * 洗牌
   */
  shuffle(seed?: string): void {
    this.cards = shuffleDeck(this.cards, seed);
    this.currentIndex = 0;
  }
  
  /**
   * 执行开局烧牌
   * 返回烧掉的牌
   */
  performBurn(): Card[] {
    // 第一张牌决定烧牌数量
    this.firstCard = this.cards[0] ?? null;
    if (!this.firstCard) {
      return [];
    }
    
    this.burnStartCount = calculateBurnCount(this.firstCard.rank);
    
    // 烧牌（包括第一张牌本身）
    const burnedCards: Card[] = [];
    for (let i = 0; i < this.burnStartCount + 1; i++) {
      const card = this.cards[this.currentIndex++];
      if (card) {
        burnedCards.push(card);
      }
    }
    
    return burnedCards;
  }
  
  /**
   * 发一张牌
   */
  deal(): Card | null {
    if (this.currentIndex >= this.cards.length - this.burnEndCount) {
      return null; // 牌靴即将结束
    }
    return this.cards[this.currentIndex++] ?? null;
  }
  
  /**
   * 发多张牌
   */
  dealMultiple(count: number): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.deal();
      if (card) {
        cards.push(card);
      }
    }
    return cards;
  }
  
  /**
   * 获取剩余可用牌数
   */
  getRemainingCards(): number {
    return Math.max(0, this.cards.length - this.currentIndex - this.burnEndCount);
  }
  
  /**
   * 判断牌靴是否需要更换
   */
  needsReshuffle(): boolean {
    // 剩余牌数少于一局可能需要的最大牌数（6张）时需要换靴
    return this.getRemainingCards() < 6;
  }
  
  /**
   * 获取牌靴信息
   */
  getInfo() {
    return {
      totalCards: this.cards.length,
      usedCards: this.currentIndex,
      remainingCards: this.getRemainingCards(),
      firstCard: this.firstCard,
      burnStartCount: this.burnStartCount,
      burnEndCount: this.burnEndCount,
      usableCards: this.cards.length - this.burnStartCount - 1 - this.burnEndCount,
    };
  }
  
  /**
   * 获取所有牌（用于验证）
   */
  getAllCards(): Card[] {
    return [...this.cards];
  }
}

/**
 * 获取牌的显示字符串
 */
export function getCardDisplay(card: Card): string {
  const suitSymbols: Record<CardSuit, string> = {
    'spade': '♠',
    'heart': '♥',
    'diamond': '♦',
    'club': '♣',
  };
  
  return `${suitSymbols[card.suit]}${card.rank}`;
}

/**
 * 获取牌的唯一标识
 */
export function getCardId(card: Card): string {
  return `${card.suit}_${card.rank}`;
}
