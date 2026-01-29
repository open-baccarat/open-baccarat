// ============================================
// OpenBaccarat - 百家乐游戏规则
// ============================================

import type { Card, CardRank, GameResult } from '@/types';
import { RANK_VALUES, BURN_COUNT_MAP } from './constants';

/**
 * 计算单张牌的点数
 */
export function getCardValue(rank: CardRank): number {
  return RANK_VALUES[rank];
}

/**
 * 计算手牌总点数（取个位数）
 */
export function calculateHandTotal(cards: Card[]): number {
  const sum = cards.reduce((total, card) => total + getCardValue(card.rank), 0);
  return sum % 10;
}

/**
 * 判断是否为天牌（Natural）
 * 天牌：前两张牌总点数为 8 或 9
 */
export function isNatural(cards: Card[]): boolean {
  if (cards.length < 2) return false;
  const total = calculateHandTotal(cards.slice(0, 2));
  return total === 8 || total === 9;
}

/**
 * 判断闲家是否需要补牌
 * 规则：闲家前两张牌总点数 0-5 时需要补第三张牌
 */
export function shouldPlayerDraw(playerCards: Card[]): boolean {
  if (playerCards.length !== 2) return false;
  const total = calculateHandTotal(playerCards);
  return total <= 5;
}

/**
 * 判断庄家是否需要补牌
 * 规则比较复杂，取决于庄家点数和闲家第三张牌
 */
export function shouldBankerDraw(
  bankerCards: Card[],
  playerThirdCard: Card | null
): boolean {
  if (bankerCards.length !== 2) return false;
  
  const bankerTotal = calculateHandTotal(bankerCards);
  
  // 庄家 7 点或以上不补牌
  if (bankerTotal >= 7) return false;
  
  // 闲家没有补牌时
  if (!playerThirdCard) {
    // 庄家 0-5 点补牌，6 点不补
    return bankerTotal <= 5;
  }
  
  // 闲家有补牌时，根据闲家第三张牌决定
  const playerThirdValue = getCardValue(playerThirdCard.rank);
  
  switch (bankerTotal) {
    case 0:
    case 1:
    case 2:
      // 庄家 0-2 点，无论闲家第三张是什么都补牌
      return true;
    case 3:
      // 闲家第三张不是 8 时补牌
      return playerThirdValue !== 8;
    case 4:
      // 闲家第三张是 2-7 时补牌
      return playerThirdValue >= 2 && playerThirdValue <= 7;
    case 5:
      // 闲家第三张是 4-7 时补牌
      return playerThirdValue >= 4 && playerThirdValue <= 7;
    case 6:
      // 闲家第三张是 6-7 时补牌
      return playerThirdValue === 6 || playerThirdValue === 7;
    default:
      return false;
  }
}

/**
 * 判断游戏结果
 */
export function determineResult(playerTotal: number, bankerTotal: number): GameResult {
  if (playerTotal > bankerTotal) {
    return 'player_win';
  } else if (bankerTotal > playerTotal) {
    return 'banker_win';
  } else {
    return 'tie';
  }
}

/**
 * 判断是否为对子
 */
export function isPair(cards: Card[]): boolean {
  if (cards.length < 2) return false;
  return cards[0]!.rank === cards[1]!.rank;
}

/**
 * 获取胜方的最终点数
 */
export function getWinningTotal(playerTotal: number, bankerTotal: number): number {
  return Math.max(playerTotal, bankerTotal);
}

/**
 * 计算开局烧牌数量
 * 根据第一张牌的点数决定
 */
export function calculateBurnCount(firstCardRank: CardRank): number {
  return BURN_COUNT_MAP[firstCardRank];
}

/**
 * 模拟完整的一局游戏
 * 返回发牌顺序和结果
 */
export function simulateRound(deck: Card[]): {
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  result: GameResult;
  cardsUsed: number;
} {
  let cardIndex = 0;
  const playerCards: Card[] = [];
  const bankerCards: Card[] = [];
  
  // 发前两张牌（闲-庄-闲-庄）
  playerCards.push(deck[cardIndex++]!);
  bankerCards.push(deck[cardIndex++]!);
  playerCards.push(deck[cardIndex++]!);
  bankerCards.push(deck[cardIndex++]!);
  
  // 检查天牌
  const playerNatural = isNatural(playerCards);
  const bankerNatural = isNatural(bankerCards);
  
  if (!playerNatural && !bankerNatural) {
    // 闲家补牌判断
    let playerThirdCard: Card | null = null;
    if (shouldPlayerDraw(playerCards)) {
      playerThirdCard = deck[cardIndex++]!;
      playerCards.push(playerThirdCard);
    }
    
    // 庄家补牌判断
    if (shouldBankerDraw(bankerCards, playerThirdCard)) {
      bankerCards.push(deck[cardIndex++]!);
    }
  }
  
  const playerTotal = calculateHandTotal(playerCards);
  const bankerTotal = calculateHandTotal(bankerCards);
  const result = determineResult(playerTotal, bankerTotal);
  
  return {
    playerCards,
    bankerCards,
    playerTotal,
    bankerTotal,
    result,
    cardsUsed: cardIndex,
  };
}

/**
 * 验证一局游戏结果是否正确
 * 用于验证区块链上的记录
 */
export function verifyRound(
  playerCards: Card[],
  bankerCards: Card[],
  expectedResult: GameResult
): boolean {
  const playerTotal = calculateHandTotal(playerCards);
  const bankerTotal = calculateHandTotal(bankerCards);
  const actualResult = determineResult(playerTotal, bankerTotal);
  
  return actualResult === expectedResult;
}
