// ============================================
// OpenBaccarat - 扑克牌纹理生成器
// ============================================

import type { CardSuit, CardRank } from '@/types';

// 花色符号映射
const SUIT_SYMBOLS: Record<CardSuit, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
};

// 花色颜色
const SUIT_COLORS: Record<CardSuit, string> = {
  spade: '#000000',
  heart: '#dc2626',
  diamond: '#dc2626',
  club: '#000000',
};

// 点数显示
const RANK_DISPLAY: Record<CardRank, string> = {
  A: 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
};

/**
 * 生成扑克牌牌面纹理
 */
export function generateCardTexture(
  suit: CardSuit,
  rank: CardRank,
  width: number = 256,
  height: number = 358
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 圆角边框
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  roundRect(ctx, 2, 2, width - 4, height - 4, 10);
  ctx.stroke();

  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];
  const rankText = RANK_DISPLAY[rank];

  // 左上角点数和花色
  ctx.fillStyle = color;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(rankText, 30, 40);
  ctx.font = '28px Arial';
  ctx.fillText(symbol, 30, 70);

  // 右下角点数和花色（倒置）
  ctx.save();
  ctx.translate(width - 30, height - 25);
  ctx.rotate(Math.PI);
  ctx.font = 'bold 36px Arial';
  ctx.fillText(rankText, 0, 0);
  ctx.font = '28px Arial';
  ctx.fillText(symbol, 0, 30);
  ctx.restore();

  // 中心花色图案
  drawCenterPattern(ctx, suit, rank, width, height);

  return canvas;
}

/**
 * 绘制中心花色图案
 */
function drawCenterPattern(
  ctx: CanvasRenderingContext2D,
  suit: CardSuit,
  rank: CardRank,
  width: number,
  height: number
) {
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];
  const cx = width / 2;
  const cy = height / 2;

  ctx.fillStyle = color;

  // 根据点数绘制不同数量的花色
  const positions = getSymbolPositions(rank, width, height);

  positions.forEach(({ x, y, rotated }) => {
    ctx.save();
    ctx.translate(x, y);
    if (rotated) {
      ctx.rotate(Math.PI);
    }
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 0, 0);
    ctx.restore();
  });

  // J, Q, K 绘制人物轮廓
  if (['J', 'Q', 'K'].includes(rank)) {
    drawFaceCard(ctx, rank, color, cx, cy);
  }
}

/**
 * 获取花色符号位置
 */
function getSymbolPositions(
  rank: CardRank,
  width: number,
  height: number
): { x: number; y: number; rotated: boolean }[] {
  const cx = width / 2;
  const cy = height / 2;
  const colLeft = width * 0.25;
  const colRight = width * 0.75;
  const rowTop = height * 0.25;
  const rowMidTop = height * 0.35;
  const rowMid = height * 0.5;
  const rowMidBot = height * 0.65;
  const rowBot = height * 0.75;

  const patterns: Record<CardRank, { x: number; y: number; rotated: boolean }[]> = {
    A: [{ x: cx, y: cy, rotated: false }],
    '2': [
      { x: cx, y: rowTop, rotated: false },
      { x: cx, y: rowBot, rotated: true },
    ],
    '3': [
      { x: cx, y: rowTop, rotated: false },
      { x: cx, y: cy, rotated: false },
      { x: cx, y: rowBot, rotated: true },
    ],
    '4': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    '5': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: cx, y: cy, rotated: false },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    '6': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: colLeft, y: cy, rotated: false },
      { x: colRight, y: cy, rotated: false },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    '7': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: cx, y: rowMidTop, rotated: false },
      { x: colLeft, y: cy, rotated: false },
      { x: colRight, y: cy, rotated: false },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    '8': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: cx, y: rowMidTop, rotated: false },
      { x: colLeft, y: cy, rotated: false },
      { x: colRight, y: cy, rotated: false },
      { x: cx, y: rowMidBot, rotated: true },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    '9': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: colLeft, y: rowMidTop, rotated: false },
      { x: colRight, y: rowMidTop, rotated: false },
      { x: cx, y: cy, rotated: false },
      { x: colLeft, y: rowMidBot, rotated: true },
      { x: colRight, y: rowMidBot, rotated: true },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    '10': [
      { x: colLeft, y: rowTop, rotated: false },
      { x: colRight, y: rowTop, rotated: false },
      { x: cx, y: rowTop + 30, rotated: false },
      { x: colLeft, y: rowMidTop + 15, rotated: false },
      { x: colRight, y: rowMidTop + 15, rotated: false },
      { x: colLeft, y: rowMidBot - 15, rotated: true },
      { x: colRight, y: rowMidBot - 15, rotated: true },
      { x: cx, y: rowBot - 30, rotated: true },
      { x: colLeft, y: rowBot, rotated: true },
      { x: colRight, y: rowBot, rotated: true },
    ],
    J: [],
    Q: [],
    K: [],
  };

  return patterns[rank] || [];
}

/**
 * 绘制人头牌
 */
function drawFaceCard(
  ctx: CanvasRenderingContext2D,
  rank: CardRank,
  color: string,
  cx: number,
  cy: number
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // 简化的人物轮廓
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 30, 40, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 皇冠或帽子
  if (rank === 'K') {
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 55);
    ctx.lineTo(cx - 20, cy - 70);
    ctx.lineTo(cx - 10, cy - 60);
    ctx.lineTo(cx, cy - 75);
    ctx.lineTo(cx + 10, cy - 60);
    ctx.lineTo(cx + 20, cy - 70);
    ctx.lineTo(cx + 25, cy - 55);
    ctx.closePath();
    ctx.fill();
  } else if (rank === 'Q') {
    ctx.beginPath();
    ctx.arc(cx, cy - 65, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (rank === 'J') {
    ctx.fillRect(cx - 20, cy - 70, 40, 10);
  }

  // 身体轮廓
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 20);
  ctx.lineTo(cx - 40, cy + 60);
  ctx.lineTo(cx + 40, cy + 60);
  ctx.lineTo(cx + 35, cy + 20);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * 生成牌背纹理
 */
export function generateCardBackTexture(
  width: number = 256,
  height: number = 358,
  primaryColor: string = '#1a237e',
  secondaryColor: string = '#0d47a1'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 主背景
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, width, height);

  // 边框
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  roundRect(ctx, 8, 8, width - 16, height - 16, 8);
  ctx.stroke();

  // 菱形图案
  ctx.fillStyle = secondaryColor;
  const patternSize = 20;
  for (let y = 20; y < height - 20; y += patternSize) {
    for (let x = 20; x < width - 20; x += patternSize) {
      if ((x + y) % (patternSize * 2) === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y - patternSize / 2);
        ctx.lineTo(x + patternSize / 2, y);
        ctx.lineTo(x, y + patternSize / 2);
        ctx.lineTo(x - patternSize / 2, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // 中心装饰
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OB', width / 2, height / 2);

  return canvas;
}

/**
 * 绘制圆角矩形
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 纹理缓存管理器
 */
class TextureCache {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private backTexture: HTMLCanvasElement | null = null;

  /**
   * 获取牌面纹理（带缓存）
   */
  getCardTexture(suit: CardSuit, rank: CardRank): HTMLCanvasElement {
    const key = `${suit}-${rank}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, generateCardTexture(suit, rank));
    }
    return this.cache.get(key)!;
  }

  /**
   * 获取牌背纹理（带缓存）
   */
  getBackTexture(): HTMLCanvasElement {
    if (!this.backTexture) {
      this.backTexture = generateCardBackTexture();
    }
    return this.backTexture;
  }

  /**
   * 预加载所有纹理
   */
  preloadAll(): void {
    const suits: CardSuit[] = ['spade', 'heart', 'diamond', 'club'];
    const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        this.getCardTexture(suit, rank);
      });
    });
    
    this.getBackTexture();
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
    this.backTexture = null;
  }
}

// 导出单例
export const textureCache = new TextureCache();
