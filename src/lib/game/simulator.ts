// ============================================
// OpenBaccarat - 游戏模拟器
// ============================================

import type { Card, Round, GameResult, RoadmapPoint } from '@/types';
import { ShoeManager, getCardDisplay } from './deck';
import { 
  calculateHandTotal, 
  isNatural, 
  shouldPlayerDraw, 
  shouldBankerDraw, 
  determineResult, 
  isPair,
  getWinningTotal 
} from './rules';

export interface SimulatedRound {
  roundNumber: number;
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  result: GameResult;
  isPlayerPair: boolean;
  isBankerPair: boolean;
  isNatural: boolean;
  cardsUsed: number;
}

/**
 * 游戏模拟器类
 * 用于演示和测试游戏逻辑
 */
export class GameSimulator {
  private shoeManager: ShoeManager;
  private roundNumber: number;
  private history: SimulatedRound[];
  private isShuffled: boolean;

  constructor() {
    this.shoeManager = new ShoeManager();
    this.roundNumber = 0;
    this.history = [];
    this.isShuffled = false;
  }

  /**
   * 开始新牌靴
   */
  startNewShoe(seed?: string): {
    firstCard: Card | null;
    burnCount: number;
    burnedCards: Card[];
  } {
    this.shoeManager = new ShoeManager();
    this.shoeManager.shuffle(seed);
    this.isShuffled = true;
    this.roundNumber = 0;
    this.history = [];

    const burnedCards = this.shoeManager.performBurn();
    const info = this.shoeManager.getInfo();

    return {
      firstCard: info.firstCard,
      burnCount: info.burnStartCount,
      burnedCards,
    };
  }

  /**
   * 模拟一局游戏
   */
  playRound(): SimulatedRound | null {
    if (!this.isShuffled) {
      this.startNewShoe();
    }

    if (this.shoeManager.needsReshuffle()) {
      return null; // 需要换靴
    }

    this.roundNumber++;
    
    const playerCards: Card[] = [];
    const bankerCards: Card[] = [];

    // 发前两张牌（闲-庄-闲-庄）
    const card1 = this.shoeManager.deal();
    const card2 = this.shoeManager.deal();
    const card3 = this.shoeManager.deal();
    const card4 = this.shoeManager.deal();

    if (!card1 || !card2 || !card3 || !card4) {
      return null; // 牌不够
    }

    playerCards.push(card1, card3);
    bankerCards.push(card2, card4);

    let cardsUsed = 4;

    // 检查天牌
    const playerNatural = isNatural(playerCards);
    const bankerNatural = isNatural(bankerCards);

    if (!playerNatural && !bankerNatural) {
      // 闲家补牌判断
      let playerThirdCard: Card | null = null;
      if (shouldPlayerDraw(playerCards)) {
        playerThirdCard = this.shoeManager.deal();
        if (playerThirdCard) {
          playerCards.push(playerThirdCard);
          cardsUsed++;
        }
      }

      // 庄家补牌判断
      if (shouldBankerDraw(bankerCards, playerThirdCard)) {
        const bankerThirdCard = this.shoeManager.deal();
        if (bankerThirdCard) {
          bankerCards.push(bankerThirdCard);
          cardsUsed++;
        }
      }
    }

    const playerTotal = calculateHandTotal(playerCards);
    const bankerTotal = calculateHandTotal(bankerCards);
    const result = determineResult(playerTotal, bankerTotal);

    const round: SimulatedRound = {
      roundNumber: this.roundNumber,
      playerCards,
      bankerCards,
      playerTotal,
      bankerTotal,
      result,
      isPlayerPair: isPair(playerCards),
      isBankerPair: isPair(bankerCards),
      isNatural: playerNatural || bankerNatural,
      cardsUsed,
    };

    this.history.push(round);
    return round;
  }

  /**
   * 获取牌靴信息
   */
  getShoeInfo() {
    return this.shoeManager.getInfo();
  }

  /**
   * 获取游戏历史
   */
  getHistory(): SimulatedRound[] {
    return [...this.history];
  }

  /**
   * 获取统计数据
   */
  getStats() {
    const stats = {
      totalRounds: this.history.length,
      bankerWins: 0,
      playerWins: 0,
      ties: 0,
      bankerPairs: 0,
      playerPairs: 0,
      naturals: 0,
    };

    for (const round of this.history) {
      if (round.result === 'banker_win') stats.bankerWins++;
      else if (round.result === 'player_win') stats.playerWins++;
      else stats.ties++;

      if (round.isBankerPair) stats.bankerPairs++;
      if (round.isPlayerPair) stats.playerPairs++;
      if (round.isNatural) stats.naturals++;
    }

    return stats;
  }

  /**
   * 获取路单数据
   */
  getRoadmapData(): RoadmapPoint[] {
    return this.history.map((round) => ({
      result: round.result,
      roundId: `sim-${round.roundNumber}`,
      roundNumber: round.roundNumber,
      isPair: {
        player: round.isPlayerPair,
        banker: round.isBankerPair,
      },
    }));
  }

  /**
   * 是否需要换靴
   */
  needsNewShoe(): boolean {
    return this.shoeManager.needsReshuffle();
  }

  /**
   * 格式化回合信息为字符串
   */
  formatRound(round: SimulatedRound): string {
    const playerCardsStr = round.playerCards.map(getCardDisplay).join(' ');
    const bankerCardsStr = round.bankerCards.map(getCardDisplay).join(' ');

    return [
      `=== 第 ${round.roundNumber} 局 ===`,
      `闲家: ${playerCardsStr} = ${round.playerTotal}${round.isPlayerPair ? ' (对子)' : ''}`,
      `庄家: ${bankerCardsStr} = ${round.bankerTotal}${round.isBankerPair ? ' (对子)' : ''}`,
      `结果: ${round.result === 'banker_win' ? '庄赢' : round.result === 'player_win' ? '闲赢' : '和局'}${round.isNatural ? ' (天牌)' : ''}`,
    ].join('\n');
  }
}

/**
 * 快速模拟多局游戏
 */
export function simulateMultipleRounds(count: number, seed?: string): {
  rounds: SimulatedRound[];
  stats: ReturnType<GameSimulator['getStats']>;
  shoesUsed: number;
} {
  const simulator = new GameSimulator();
  const rounds: SimulatedRound[] = [];
  let shoesUsed = 0;

  simulator.startNewShoe(seed);
  shoesUsed++;

  for (let i = 0; i < count; i++) {
    if (simulator.needsNewShoe()) {
      simulator.startNewShoe(seed ? `${seed}-${shoesUsed}` : undefined);
      shoesUsed++;
    }

    const round = simulator.playRound();
    if (round) {
      rounds.push(round);
    }
  }

  return {
    rounds,
    stats: simulator.getStats(),
    shoesUsed,
  };
}

// 导出单例模拟器实例
export const gameSimulator = new GameSimulator();
