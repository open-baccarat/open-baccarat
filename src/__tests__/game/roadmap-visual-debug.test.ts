// ============================================
// 路单视觉调试测试 - 输出精确网格结构
// ============================================

import { describe, it, expect } from 'vitest';
import {
  generateBigRoad,
  generateBigEyeBoy,
  generateSmallRoad,
  generateCockroachRoad,
  type BigRoadCell,
  type RoadmapCell,
} from '@/lib/game/roadmap';
import type { RoadmapPoint, GameResult } from '@/types';

// 49局数据 (截图显示)
const data49: GameResult[] = [
  'banker_win', 'player_win', 'tie', 'player_win', // 1-4
  'banker_win', 'banker_win', 'banker_win', 'banker_win', // 5-8
  'banker_win', 'banker_win', 'banker_win', 'banker_win', // 9-12
  'player_win', 'tie', 'player_win', 'player_win', // 13-16
  'banker_win', 'tie', 'player_win', 'player_win', // 17-20
  'banker_win', 'banker_win', 'player_win', 'player_win', // 21-24
  'player_win', 'tie', 'banker_win', 'banker_win', // 25-28
  'banker_win', 'banker_win', 'player_win', 'banker_win', // 29-32
  'player_win', 'player_win', 'banker_win', 'banker_win', // 33-36
  'player_win', 'banker_win', 'player_win', 'banker_win', // 37-40
  'player_win', 'player_win', 'banker_win', 'banker_win', // 41-44
  'banker_win', 'banker_win', 'tie', 'player_win', // 45-48
  'tie', // 49
];

const mockPoints: RoadmapPoint[] = data49.map((result, i) => ({
  result,
  roundNumber: i + 1,
  roundId: `r${i + 1}`,
  isPair: { player: false, banker: false },
}));

describe('视觉对比调试', () => {
  it('输出大路网格结构', () => {
    const bigRoad = generateBigRoad(mockPoints);
    
    console.log('\n========== 大路网格 ==========');
    for (let col = 0; col < 25; col++) {
      const cells = bigRoad[col]!.filter((c) => c.result !== null);
      if (cells.length > 0) {
        const results = cells.map((c, row) => {
          const symbol = c.result === 'banker_win' ? 'R' : 'B';
          const tie = c.tieCount > 0 ? `+${c.tieCount}T` : '';
          return `(${row})${symbol}${tie}`;
        });
        console.log(`Col ${col.toString().padStart(2)}: ${results.join(' ')}`);
      }
    }
  });

  it('输出大眼仔网格结构 (逐行)', () => {
    const bigRoad = generateBigRoad(mockPoints);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);
    
    console.log('\n========== 大眼仔路网格 (逐行显示) ==========');
    console.log('R=红(齐整), B=蓝(不齐整), .=空\n');
    
    for (let row = 0; row < 6; row++) {
      let rowStr = `Row ${row}: `;
      for (let col = 0; col < 20; col++) {
        const cell = bigEyeBoy[col]?.[row];
        if (cell?.result === 'banker_win') {
          rowStr += 'R ';
        } else if (cell?.result === 'player_win') {
          rowStr += 'B ';
        } else {
          rowStr += '. ';
        }
      }
      console.log(rowStr);
    }
  });

  it('输出大眼仔网格结构 (逐列)', () => {
    const bigRoad = generateBigRoad(mockPoints);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);
    
    console.log('\n========== 大眼仔路网格 (逐列显示) ==========');
    
    for (let col = 0; col < 20; col++) {
      const cells = bigEyeBoy[col]!.filter((c) => c.result !== null);
      if (cells.length > 0) {
        const results = cells.map((c) => c.result === 'banker_win' ? 'R' : 'B');
        console.log(`Col ${col.toString().padStart(2)}: [${results.join(',')}] len=${cells.length}`);
      }
    }
  });

  it('输出小路网格结构', () => {
    const bigRoad = generateBigRoad(mockPoints);
    const smallRoad = generateSmallRoad(bigRoad);
    
    console.log('\n========== 小路网格 (逐列) ==========');
    
    for (let col = 0; col < 20; col++) {
      const cells = smallRoad[col]!.filter((c) => c.result !== null);
      if (cells.length > 0) {
        const results = cells.map((c) => c.result === 'banker_win' ? 'R' : 'B');
        console.log(`Col ${col.toString().padStart(2)}: [${results.join(',')}] len=${cells.length}`);
      }
    }
  });

  it('输出蟑螂路网格结构', () => {
    const bigRoad = generateBigRoad(mockPoints);
    const cockroachRoad = generateCockroachRoad(bigRoad);
    
    console.log('\n========== 蟑螂路网格 (逐列) ==========');
    
    for (let col = 0; col < 20; col++) {
      const cells = cockroachRoad[col]!.filter((c) => c.result !== null);
      if (cells.length > 0) {
        const results = cells.map((c) => c.result === 'banker_win' ? 'R' : 'B');
        console.log(`Col ${col.toString().padStart(2)}: [${results.join(',')}] len=${cells.length}`);
      }
    }
  });
});
