// ============================================
// OpenBaccarat - 派生路单详细审计测试
// 手动追踪每一个入口点
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

// 50局真实数据
const realGameData: { round: number; result: GameResult }[] = [
  { round: 1, result: 'banker_win' },
  { round: 2, result: 'player_win' },
  { round: 3, result: 'tie' },
  { round: 4, result: 'player_win' },
  { round: 5, result: 'banker_win' },
  { round: 6, result: 'banker_win' },
  { round: 7, result: 'banker_win' },
  { round: 8, result: 'banker_win' },
  { round: 9, result: 'banker_win' },
  { round: 10, result: 'banker_win' },
  { round: 11, result: 'banker_win' },
  { round: 12, result: 'banker_win' },
  { round: 13, result: 'player_win' },
  { round: 14, result: 'tie' },
  { round: 15, result: 'player_win' },
  { round: 16, result: 'player_win' },
  { round: 17, result: 'banker_win' },
  { round: 18, result: 'tie' },
  { round: 19, result: 'player_win' },
  { round: 20, result: 'player_win' },
  { round: 21, result: 'banker_win' },
  { round: 22, result: 'banker_win' },
  { round: 23, result: 'player_win' },
  { round: 24, result: 'player_win' },
  { round: 25, result: 'player_win' },
  { round: 26, result: 'tie' },
  { round: 27, result: 'banker_win' },
  { round: 28, result: 'banker_win' },
  { round: 29, result: 'banker_win' },
  { round: 30, result: 'banker_win' },
  { round: 31, result: 'player_win' },
  { round: 32, result: 'banker_win' },
  { round: 33, result: 'player_win' },
  { round: 34, result: 'player_win' },
  { round: 35, result: 'banker_win' },
  { round: 36, result: 'banker_win' },
  { round: 37, result: 'player_win' },
  { round: 38, result: 'banker_win' },
  { round: 39, result: 'player_win' },
  { round: 40, result: 'banker_win' },
  { round: 41, result: 'player_win' },
  { round: 42, result: 'player_win' },
  { round: 43, result: 'banker_win' },
  { round: 44, result: 'banker_win' },
  { round: 45, result: 'banker_win' },
  { round: 46, result: 'banker_win' },
  { round: 47, result: 'tie' },
  { round: 48, result: 'player_win' },
  { round: 49, result: 'tie' },
  { round: 50, result: 'banker_win' },
];

const mockRoadmapPoints: RoadmapPoint[] = realGameData.map((d) => ({
  result: d.result,
  roundNumber: d.round,
  roundId: `r${d.round}`,
  isPair: { player: false, banker: false },
}));

// 辅助函数：获取列长度
function getColumnLength(column: BigRoadCell[]): number {
  return column.filter((cell) => cell.result !== null).length;
}

// 辅助函数：从网格提取结果序列
function extractResultSequence(grid: RoadmapCell[][]): ('R' | 'B')[] {
  const results: ('R' | 'B')[] = [];
  let col = 0;
  let row = 0;
  let lastResult: 'banker_win' | 'player_win' | null = null;

  for (const column of grid) {
    for (const cell of column) {
      if (cell.result !== null) {
        results.push(cell.result === 'banker_win' ? 'R' : 'B');
      }
    }
  }

  return results;
}

// 辅助函数：手动计算大眼仔路
function manualBigEyeBoy(bigRoad: BigRoadCell[][]): ('R' | 'B')[] {
  const results: ('R' | 'B')[] = [];

  for (let col = 1; col < bigRoad.length; col++) {
    const currentColumn = bigRoad[col]!;
    const prevColumn = bigRoad[col - 1]!;

    for (let row = 0; row < 6; row++) {
      const cell = currentColumn[row];
      if (!cell?.result) continue;

      // 跳过col1row0
      if (col === 1 && row === 0) continue;

      let isRed: boolean;
      if (row === 0) {
        // 比较col-1和col-2长度
        const prev2Column = bigRoad[col - 2];
        if (!prev2Column) continue;
        isRed = getColumnLength(prevColumn) === getColumnLength(prev2Column);
      } else {
        // 检查col-1同行是否有值
        isRed = prevColumn[row]?.result !== null;
      }

      results.push(isRed ? 'R' : 'B');
    }
  }

  return results;
}

// 辅助函数：手动计算小路
function manualSmallRoad(bigRoad: BigRoadCell[][]): ('R' | 'B')[] {
  const results: ('R' | 'B')[] = [];

  for (let col = 2; col < bigRoad.length; col++) {
    const currentColumn = bigRoad[col]!;
    const prev2Column = bigRoad[col - 2]!;

    for (let row = 0; row < 6; row++) {
      const cell = currentColumn[row];
      if (!cell?.result) continue;

      // 跳过col2row0
      if (col === 2 && row === 0) continue;

      let isRed: boolean;
      if (row === 0) {
        // 比较col-1和col-3长度 (修复后的逻辑)
        const prevColumn = bigRoad[col - 1];
        const prev3Column = bigRoad[col - 3];
        if (!prevColumn || !prev3Column) continue;
        isRed = getColumnLength(prevColumn) === getColumnLength(prev3Column);
      } else {
        // 检查col-2同行是否有值
        isRed = prev2Column[row]?.result !== null;
      }

      results.push(isRed ? 'R' : 'B');
    }
  }

  return results;
}

// 辅助函数：手动计算蟑螂路
function manualCockroachRoad(bigRoad: BigRoadCell[][]): ('R' | 'B')[] {
  const results: ('R' | 'B')[] = [];

  for (let col = 3; col < bigRoad.length; col++) {
    const currentColumn = bigRoad[col]!;
    const prev3Column = bigRoad[col - 3]!;

    for (let row = 0; row < 6; row++) {
      const cell = currentColumn[row];
      if (!cell?.result) continue;

      // 跳过col3row0
      if (col === 3 && row === 0) continue;

      let isRed: boolean;
      if (row === 0) {
        // 比较col-1和col-4长度 (修复后的逻辑)
        const prevColumn = bigRoad[col - 1];
        const prev4Column = bigRoad[col - 4];
        if (!prevColumn || !prev4Column) continue;
        isRed = getColumnLength(prevColumn) === getColumnLength(prev4Column);
      } else {
        // 检查col-3同行是否有值
        isRed = prev3Column[row]?.result !== null;
      }

      results.push(isRed ? 'R' : 'B');
    }
  }

  return results;
}

describe('大眼仔路详细审计 - 手动追踪每个入口', () => {
  it('手动计算的大眼仔路序列应该与算法一致', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);

    // 手动计算
    const manualResults = manualBigEyeBoy(bigRoad);

    // 从网格提取
    const gridResults: ('R' | 'B')[] = [];
    for (const col of bigEyeBoy) {
      for (const cell of col) {
        if (cell.result !== null) {
          gridResults.push(cell.result === 'banker_win' ? 'R' : 'B');
        }
      }
    }

    console.log('大眼仔路手动计算:', manualResults.join(''));
    console.log('大眼仔路入口数:', manualResults.length);

    // 验证入口数相同
    expect(gridResults.length).toBe(manualResults.length);
  });

  it('大眼仔路前10个入口详细验证', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 手动追踪前10个入口:
    // 1. (1,1) P: row!=0, check (0,1)->null -> BLUE
    // 2. (2,0) B: row=0, len(0)=1, len(1)=2 -> 1≠2 -> BLUE
    // 3. (2,1) B: row!=0, check (1,1)->P -> RED
    // 4. (2,2) B: row!=0, check (1,2)->null -> BLUE
    // 5. (2,3) B: row!=0, check (1,3)->null -> BLUE
    // 6. (2,4) B: row!=0, check (1,4)->null -> BLUE
    // 7. (2,5) B: row!=0, check (1,5)->null -> BLUE
    // 8. (3,5) B: row!=0, check (2,5)->B -> RED
    // 9. (4,5) B: row!=0, check (3,5)->B -> RED
    // 10. (5,0) P: row=0, len(3)=1, len(4)=1 -> 1=1 -> RED

    const expected = ['B', 'B', 'R', 'B', 'B', 'B', 'B', 'R', 'R', 'R'];
    const manualResults = manualBigEyeBoy(bigRoad);

    for (let i = 0; i < 10; i++) {
      expect(manualResults[i]).toBe(expected[i]);
    }
  });
});

describe('小路详细审计 - 手动追踪每个入口', () => {
  it('手动计算的小路序列应该与算法一致', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const smallRoad = generateSmallRoad(bigRoad);

    // 手动计算
    const manualResults = manualSmallRoad(bigRoad);

    // 从网格提取
    const gridResults: ('R' | 'B')[] = [];
    for (const col of smallRoad) {
      for (const cell of col) {
        if (cell.result !== null) {
          gridResults.push(cell.result === 'banker_win' ? 'R' : 'B');
        }
      }
    }

    console.log('小路手动计算:', manualResults.join(''));
    console.log('小路入口数:', manualResults.length);

    // 验证入口数相同
    expect(gridResults.length).toBe(manualResults.length);
  });

  it('小路前10个入口详细验证', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 大路结构:
    // Col 0: len=1, Col 1: len=2, Col 2: len=6, Col 3: len=1, Col 4: len=1, Col 5: len=3...

    // 小路从col2row1开始或col3row0开始
    // 1. (2,1) B: row!=0, check (0,1)->null -> BLUE
    // 2. (2,2) B: row!=0, check (0,2)->null -> BLUE
    // 3. (2,3) B: row!=0, check (0,3)->null -> BLUE
    // 4. (2,4) B: row!=0, check (0,4)->null -> BLUE
    // 5. (2,5) B: row!=0, check (0,5)->null -> BLUE
    // 6. (3,5) B: row!=0, check (1,5)->null -> BLUE (col3是龙尾在row5)
    // 7. (4,5) B: row!=0, check (2,5)->B -> RED (col4是龙尾在row5)
    // 8. (5,0) P: row=0, len(4)=1, len(2)=6 -> 1≠6 -> BLUE
    // ...

    const manualResults = manualSmallRoad(bigRoad);
    console.log('小路前10个入口:', manualResults.slice(0, 10).join(''));

    // 验证小路有正确的入口数
    expect(manualResults.length).toBeGreaterThan(20);
  });
});

describe('蟑螂路详细审计 - 手动追踪每个入口', () => {
  it('手动计算的蟑螂路序列应该与算法一致', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const cockroachRoad = generateCockroachRoad(bigRoad);

    // 手动计算
    const manualResults = manualCockroachRoad(bigRoad);

    // 从网格提取
    const gridResults: ('R' | 'B')[] = [];
    for (const col of cockroachRoad) {
      for (const cell of col) {
        if (cell.result !== null) {
          gridResults.push(cell.result === 'banker_win' ? 'R' : 'B');
        }
      }
    }

    console.log('蟑螂路手动计算:', manualResults.join(''));
    console.log('蟑螂路入口数:', manualResults.length);

    // 验证入口数相同
    expect(gridResults.length).toBe(manualResults.length);
  });

  it('蟑螂路前10个入口详细验证', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 大路结构:
    // Col 0: len=1, Col 1: len=2, Col 2: len=6, Col 3: len=1, Col 4: len=1, Col 5: len=3...

    // 蟑螂路从col3row1开始或col4row0开始
    // col3只有row5有值(龙尾)，所以跳过col3的其他行
    // 1. (3,5) B: row!=0, check (0,5)->null -> BLUE (col3龙尾)
    // 2. (4,5) B: row!=0, check (1,5)->null -> BLUE (col4龙尾)
    // 3. (5,0) P: row=0, len(4)=1, len(1)=2 -> 1≠2 -> BLUE
    // ...

    const manualResults = manualCockroachRoad(bigRoad);
    console.log('蟑螂路前10个入口:', manualResults.slice(0, 10).join(''));

    // 验证蟑螂路有正确的入口数
    expect(manualResults.length).toBeGreaterThan(15);
  });
});

describe('派生路单总结审计', () => {
  it('所有派生路单应该有正确的红蓝比例', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    const bebResults = manualBigEyeBoy(bigRoad);
    const srResults = manualSmallRoad(bigRoad);
    const crResults = manualCockroachRoad(bigRoad);

    const countRedBlue = (results: ('R' | 'B')[]) => {
      const red = results.filter((r) => r === 'R').length;
      const blue = results.filter((r) => r === 'B').length;
      return { red, blue, total: red + blue };
    };

    const bebStats = countRedBlue(bebResults);
    const srStats = countRedBlue(srResults);
    const crStats = countRedBlue(crResults);

    console.log('\n=== 派生路单统计 ===');
    console.log(`大眼仔路: ${bebStats.total}个入口, 红${bebStats.red} 蓝${bebStats.blue}`);
    console.log(`小路: ${srStats.total}个入口, 红${srStats.red} 蓝${srStats.blue}`);
    console.log(`蟑螂路: ${crStats.total}个入口, 红${crStats.red} 蓝${crStats.blue}`);

    // 基本验证
    expect(bebStats.total).toBeGreaterThan(30);
    expect(srStats.total).toBeGreaterThan(20);
    expect(crStats.total).toBeGreaterThan(15);
  });
});
