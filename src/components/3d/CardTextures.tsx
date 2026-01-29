// ============================================
// OpenBaccarat - 扑克牌纹理生成器
// ============================================

'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { CardSuit, CardRank } from '@/types';

// 花色符号
const SUIT_SYMBOLS: Record<CardSuit, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
};

// 花色颜色
const SUIT_COLORS: Record<CardSuit, string> = {
  spade: '#1a1a1a',
  heart: '#dc2626',
  diamond: '#dc2626',
  club: '#1a1a1a',
};

/**
 * 使用 Canvas 生成扑克牌正面纹理
 */
export function useCardFaceTexture(suit: CardSuit, rank: CardRank): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 纹理尺寸（足够清晰）
    canvas.width = 256;
    canvas.height = 384;
    
    const width = canvas.width;
    const height = canvas.height;
    const color = SUIT_COLORS[suit];
    const symbol = SUIT_SYMBOLS[suit];
    
    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 牌面边框
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 4;
    ctx.roundRect(4, 4, width - 8, height - 8, 12);
    ctx.stroke();
    
    // 设置字体
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 左上角点数和花色
    ctx.font = 'bold 36px serif';
    ctx.fillText(rank, 28, 40);
    ctx.font = '32px serif';
    ctx.fillText(symbol, 28, 75);
    
    // 右下角点数和花色（倒置）
    ctx.save();
    ctx.translate(width - 28, height - 40);
    ctx.rotate(Math.PI);
    ctx.font = 'bold 36px serif';
    ctx.fillText(rank, 0, 0);
    ctx.font = '32px serif';
    ctx.fillText(symbol, 0, 35);
    ctx.restore();
    
    // 中心大花色
    ctx.font = '120px serif';
    ctx.fillText(symbol, width / 2, height / 2);
    
    // 根据牌面值添加额外花色图案
    const rankValue = getRankPatternCount(rank);
    if (rankValue > 0 && rankValue <= 10) {
      drawSuitPattern(ctx, suit, rankValue, width, height);
    }
    
    // 人物牌特殊处理
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      drawFaceCard(ctx, rank, color, width, height);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [suit, rank]);
}

/**
 * 使用 Canvas 生成扑克牌背面纹理
 */
export function useCardBackTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 256;
    canvas.height = 384;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 深蓝色背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(0.5, '#0d2137');
    gradient.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 边框
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 6;
    ctx.roundRect(8, 8, width - 16, height - 16, 10);
    ctx.stroke();
    
    // 内边框
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.roundRect(20, 20, width - 40, height - 40, 8);
    ctx.stroke();
    
    // 菱形图案
    ctx.fillStyle = 'rgba(201, 162, 39, 0.15)';
    const patternSize = 24;
    for (let y = 30; y < height - 30; y += patternSize) {
      for (let x = 30; x < width - 30; x += patternSize) {
        const offsetX = (Math.floor(y / patternSize) % 2) * (patternSize / 2);
        ctx.beginPath();
        ctx.moveTo(x + offsetX, y);
        ctx.lineTo(x + offsetX + patternSize / 2, y + patternSize / 2);
        ctx.lineTo(x + offsetX, y + patternSize);
        ctx.lineTo(x + offsetX - patternSize / 2, y + patternSize / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    // 中心装饰
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♠♥', width / 2, height / 2 - 20);
    ctx.fillText('♦♣', width / 2, height / 2 + 20);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/**
 * 获取点数对应的图案数量
 */
function getRankPatternCount(rank: CardRank): number {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 0;
  return parseInt(rank, 10) || 0;
}

/**
 * 绘制花色图案
 */
function drawSuitPattern(
  ctx: CanvasRenderingContext2D,
  suit: CardSuit,
  count: number,
  width: number,
  height: number
): void {
  const symbol = SUIT_SYMBOLS[suit];
  const color = SUIT_COLORS[suit];
  ctx.fillStyle = color;
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 简化的花色位置（根据数量）
  const positions = getPatternPositions(count, width, height);
  positions.forEach(([x, y, inverted]) => {
    ctx.save();
    if (inverted) {
      ctx.translate(x, y);
      ctx.rotate(Math.PI);
      ctx.fillText(symbol, 0, 0);
    } else {
      ctx.fillText(symbol, x, y);
    }
    ctx.restore();
  });
}

/**
 * 获取花色图案位置
 */
function getPatternPositions(count: number, width: number, height: number): [number, number, boolean][] {
  const cx = width / 2;
  const top = height * 0.25;
  const bottom = height * 0.75;
  const mid = height / 2;
  const left = width * 0.35;
  const right = width * 0.65;
  
  const patterns: { [key: number]: [number, number, boolean][] } = {
    2: [[cx, top, false], [cx, bottom, true]],
    3: [[cx, top, false], [cx, mid, false], [cx, bottom, true]],
    4: [[left, top, false], [right, top, false], [left, bottom, true], [right, bottom, true]],
    5: [[left, top, false], [right, top, false], [cx, mid, false], [left, bottom, true], [right, bottom, true]],
    6: [[left, top, false], [right, top, false], [left, mid, false], [right, mid, false], [left, bottom, true], [right, bottom, true]],
    7: [[left, top, false], [right, top, false], [cx, height * 0.35, false], [left, mid, false], [right, mid, false], [left, bottom, true], [right, bottom, true]],
    8: [[left, top, false], [right, top, false], [cx, height * 0.35, false], [left, mid, false], [right, mid, false], [cx, height * 0.65, true], [left, bottom, true], [right, bottom, true]],
    9: [[left, height * 0.22, false], [right, height * 0.22, false], [left, height * 0.38, false], [right, height * 0.38, false], [cx, mid, false], [left, height * 0.62, true], [right, height * 0.62, true], [left, height * 0.78, true], [right, height * 0.78, true]],
    10: [[left, height * 0.2, false], [right, height * 0.2, false], [cx, height * 0.3, false], [left, height * 0.4, false], [right, height * 0.4, false], [left, height * 0.6, true], [right, height * 0.6, true], [cx, height * 0.7, true], [left, height * 0.8, true], [right, height * 0.8, true]],
  };
  
  return patterns[count] || [];
}

/**
 * 绘制人物牌
 */
function drawFaceCard(
  ctx: CanvasRenderingContext2D,
  rank: CardRank,
  color: string,
  width: number,
  height: number
): void {
  // 简化的人物牌表示
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.1;
  ctx.font = '160px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rank, width / 2, height / 2);
  ctx.globalAlpha = 1;
}

/**
 * 预加载所有纹理的 Hook
 */
export function usePreloadedTextures() {
  const backTexture = useCardBackTexture();
  
  // 可以在这里预加载常用的牌面纹理
  return {
    backTexture,
  };
}
