// ============================================
// OpenBaccarat - 类型定义
// ============================================

// 扑克牌花色
export type CardSuit = 'spade' | 'heart' | 'diamond' | 'club';

// 扑克牌点数
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// 游戏结果
export type GameResult = 'banker_win' | 'player_win' | 'tie';

// 发牌目标
export type DealTarget = 'player' | 'banker' | 'burn_start' | 'burn_end';

// 区块链状态
export type BlockchainStatus = 'pending' | 'confirmed' | 'failed';

// 单张扑克牌
export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

// 带完整信息的发牌记录
export interface DealtCard extends Card {
  id: string;
  roundId: string;
  dealOrder: number;
  target: DealTarget;
}

// 一局游戏记录
export interface Round {
  id: string;
  shoeId: string;
  shoeNumber: number;
  roundNumber: number;
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  winningTotal: number;
  result: GameResult;
  isPair: {
    player: boolean;
    banker: boolean;
  };
  startedAt: Date;
  startedAtUnix: number;
  completedAt: Date;
  completedAtUnix: number;
  solanaSignature: string | null;
  solanaExplorerUrl: string | null;
  blockchainStatus: BlockchainStatus;
}

// 牌靴信息
export interface Shoe {
  id: string;
  shoeNumber: number;
  deckCount: number;
  totalCards: number;
  firstCard: Card | null;
  burnStartCount: number;
  burnEndCount: number;
  usableCards: number;      // 初始可用牌数（总牌数 - 开局烧牌 - 1 - 结束保留）
  cardsUsed: number;        // 已使用牌数（动态统计，来自 used_cards 表）
  roundsPlayed: number;     // 已进行的局数
  shuffleVrfProof: string | null;
  startedAt: Date;
  startedAtUnix: number;
  endedAt: Date | null;
  endedAtUnix: number | null;
  solanaSignature: string | null;
  solanaExplorerUrl: string | null;
  blockchainStatus: BlockchainStatus;
  isActive: boolean;
}

// 游戏统计
export interface GameStats {
  totalRounds: number;
  bankerWins: number;
  playerWins: number;
  ties: number;
  bankerPairs: number;
  playerPairs: number;
}

// 路单数据点
export interface RoadmapPoint {
  result: GameResult;
  roundId: string;
  roundNumber: number;
  isPair: {
    player: boolean;
    banker: boolean;
  };
}

// 当前游戏状态
export interface GameState {
  currentShoe: Shoe | null;
  currentRound: Round | null;
  phase: 'idle' | 'shuffling' | 'burning' | 'clearing' | 'dealing' | 'result' | 'waiting';
  playerCards: Card[];
  bankerCards: Card[];
  isAnimating: boolean;
}

// 3D 场景设置
export interface Scene3DSettings {
  cameraPosition: [number, number, number];
  tableColor: string;
  feltColor: string;
  ambientLightIntensity: number;
  spotlightIntensity: number;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 历史记录视图类型
export type HistoryViewType = 'list' | 'roadmap';

// 路单视图类型
export type RoadmapViewType = 'big_road' | 'big_eye_boy' | 'small_road' | 'cockroach_road' | 'bead_plate';
