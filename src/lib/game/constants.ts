// ============================================
// OpenBaccarat - 游戏常量
// ============================================

import type { CardSuit, CardRank, GameResult } from '@/types';

// 牌靴配置
export const DECK_COUNT = 8; // 8副牌
export const CARDS_PER_DECK = 52;
export const TOTAL_CARDS = DECK_COUNT * CARDS_PER_DECK; // 416张

// 烧牌规则
export const DEFAULT_BURN_END_COUNT = 15; // 牌靴结束时保留的牌数

// 花色
export const SUITS: CardSuit[] = ['spade', 'heart', 'diamond', 'club'];

// 点数
export const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 点数对应的数值
export const RANK_VALUES: Record<CardRank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 0,
  'J': 0,
  'Q': 0,
  'K': 0,
};

// 烧牌数量对应表（第一张牌点数决定烧牌数）
export const BURN_COUNT_MAP: Record<CardRank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 10,
  'Q': 10,
  'K': 10,
};

// 花色显示名称
export const SUIT_NAMES: Record<CardSuit, string> = {
  'spade': '♠',
  'heart': '♥',
  'diamond': '♦',
  'club': '♣',
};

// 花色颜色
export const SUIT_COLORS: Record<CardSuit, string> = {
  'spade': '#000000',
  'heart': '#e53e3e',
  'diamond': '#e53e3e',
  'club': '#000000',
};

// 结果标签 - 保留用于向后兼容，但推荐使用 i18n 翻译
// @deprecated 请使用 useTranslations('game') 获取翻译后的标签
export const RESULT_LABELS: Record<GameResult, string> = {
  'banker_win': 'Banker Win',
  'player_win': 'Player Win',
  'tie': 'Tie',
};

// 结果颜色 - 这些是固定的颜色值
export const RESULT_COLORS: Record<GameResult, string> = {
  'banker_win': '#dc2626', // 红色
  'player_win': '#2563eb', // 蓝色
  'tie': '#16a34a', // 绿色
};

// 路单配置
export const ROADMAP_CONFIG = {
  BIG_ROAD: {
    columns: 40,
    rows: 6,
  },
  BIG_EYE_BOY: {
    columns: 40,
    rows: 6,
  },
  SMALL_ROAD: {
    columns: 40,
    rows: 6,
  },
  COCKROACH_ROAD: {
    columns: 40,
    rows: 6,
  },
  BEAD_PLATE: {
    columns: 12,  // 与历史页面渲染列数一致
    rows: 6,
  },
};

// 动画时间配置（毫秒）
export const ANIMATION_TIMING = {
  CARD_DEAL: 800, // 发牌动画
  CARD_FLIP: 400, // 翻牌动画
  CARD_BEND: 600, // 弯牌动画（核心卖点！）
  RESULT_DISPLAY: 2000, // 结果显示
  ROUND_INTERVAL: 3000, // 局间间隔
};

// Solana 配置
export const SOLANA_CONFIG = {
  EXPLORER_URL: 'https://solscan.io/tx/',
  NETWORK: 'mainnet-beta', // or 'devnet' for testing
};
