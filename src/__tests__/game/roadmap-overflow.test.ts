// ============================================
// 测试路单超出容量时显示最新数据
// ============================================

import { describe, it, expect } from 'vitest';
import {
  generateBeadPlate,
  generateBigRoad,
  generateBigEyeBoy,
} from '@/lib/game/roadmap';
import { ROADMAP_CONFIG } from '@/lib/game/constants';
import type { RoadmapPoint, GameResult } from '@/types';

// 生成测试数据
function generateTestData(count: number, pattern: 'alternate' | 'streak' = 'alternate'): RoadmapPoint[] {
  const results: GameResult[] = [];
  for (let i = 0; i < count; i++) {
    if (pattern === 'alternate') {
      // 交替模式：B P B P B P...
      results.push(i % 2 === 0 ? 'banker_win' : 'player_win');
    } else {
      // 连胜模式：B B B B B...
      results.push('banker_win');
    }
  }
  return results.map((result, i) => ({
    result,
    roundId: `r${i + 1}`,
    roundNumber: i + 1,
    isPair: { player: false, banker: false },
  }));
}

describe('路单超出容量时显示最新数据', () => {
  describe('珠盘路', () => {
    const { columns, rows } = ROADMAP_CONFIG.BEAD_PLATE;
    const capacity = columns * rows; // 12 * 6 = 72

    it('数据不超过容量时正常显示', () => {
      const data = generateTestData(50);
      const grid = generateBeadPlate(data);
      
      // 第一个格子应该是第1局
      expect(grid[0]![0]!.roundNumber).toBe(1);
      // 最后一个有数据的格子应该是第50局
      const lastCol = Math.floor((50 - 1) / rows);
      const lastRow = (50 - 1) % rows;
      expect(grid[lastCol]![lastRow]!.roundNumber).toBe(50);
    });

    it('数据超过容量时显示最新的数据', () => {
      const totalGames = 150;
      const data = generateTestData(totalGames);
      const grid = generateBeadPlate(data);
      
      // 第一个格子应该是第 (150 - 120 + 1) = 31 局
      const expectedFirstRound = totalGames - capacity + 1;
      expect(grid[0]![0]!.roundNumber).toBe(expectedFirstRound);
      
      // 最后一个有数据的格子应该是第150局
      const lastCol = columns - 1;
      const lastRow = rows - 1;
      expect(grid[lastCol]![lastRow]!.roundNumber).toBe(totalGames);
    });

    it('数据刚好等于容量时显示全部', () => {
      const data = generateTestData(capacity);
      const grid = generateBeadPlate(data);
      
      expect(grid[0]![0]!.roundNumber).toBe(1);
      expect(grid[columns - 1]![rows - 1]!.roundNumber).toBe(capacity);
    });
  });

  describe('大路', () => {
    const { columns, rows } = ROADMAP_CONFIG.BIG_ROAD;

    it('交替模式超过列数时显示最新数据', () => {
      // 交替模式每局占一列，所以50局 = 50列
      // 显示列数是40，所以应该显示第11-50局
      const totalGames = 50;
      const data = generateTestData(totalGames, 'alternate');
      const grid = generateBigRoad(data);
      
      // 在交替模式下，50局产生50列，显示最后40列
      // 所以grid[0]应该是第11局，grid[39]应该是第50局
      const expectedFirstRound = totalGames - columns + 1; // 11
      expect(grid[0]![0]!.roundNumber).toBe(expectedFirstRound);
      expect(grid[columns - 1]![0]!.roundNumber).toBe(totalGames);
    });

    it('短连胜模式正常显示', () => {
      // 20局全庄：第1列6行（游戏1-6），然后龙尾14局（游戏7-20）
      // 总共15列，不超过40列限制
      const data = generateTestData(20, 'streak');
      const grid = generateBigRoad(data);
      
      // 第一列第一行应该是第1局
      expect(grid[0]![0]!.roundNumber).toBe(1);
      // 第一列最后一行（第6行）应该是第6局
      expect(grid[0]![5]!.roundNumber).toBe(6);
    });

    it('长连胜模式（龙尾超限）显示最新数据', () => {
      // 50局全庄：第1列6行 + 龙尾44局 = 45列，超过40列
      // 应该显示最后40列
      const data = generateTestData(50, 'streak');
      const grid = generateBigRoad(data);
      
      // 第40列（最后一列）底部应该是第50局
      expect(grid[39]![5]!.roundNumber).toBe(50);
    });

    it('大量交替模式时显示最新数据', () => {
      const totalGames = 100;
      const data = generateTestData(totalGames, 'alternate');
      const grid = generateBigRoad(data);
      
      // 100局交替 = 100列，显示最后40列
      const expectedFirstRound = totalGames - columns + 1; // 61
      expect(grid[0]![0]!.roundNumber).toBe(expectedFirstRound);
      expect(grid[columns - 1]![0]!.roundNumber).toBe(totalGames);
    });
  });

  describe('派生路（大眼仔路）', () => {
    it('派生路基于截取后的大路正确生成', () => {
      // 60局交替模式，大路显示最后40列（第21-60列）
      const data = generateTestData(60, 'alternate');
      const bigRoad = generateBigRoad(data);
      const bigEyeBoy = generateBigEyeBoy(bigRoad);
      
      // 确保大眼仔路有数据
      let hasData = false;
      for (let col = 0; col < 40; col++) {
        if (bigEyeBoy[col]![0]?.result !== null) {
          hasData = true;
          break;
        }
      }
      expect(hasData).toBe(true);
    });

    it('小数据量时派生路正常工作', () => {
      // 30局交替模式，大路30列，派生路应该正常生成
      const data = generateTestData(30, 'alternate');
      const bigRoad = generateBigRoad(data);
      const bigEyeBoy = generateBigEyeBoy(bigRoad);
      
      // 确保大眼仔路有数据
      let dataCount = 0;
      for (let col = 0; col < 40; col++) {
        for (let row = 0; row < 6; row++) {
          if (bigEyeBoy[col]![row]?.result !== null) {
            dataCount++;
          }
        }
      }
      // 交替模式下，大眼仔路每个大路入口（从col 1 row 1开始）产生一个点
      // 30列大路，约28个大眼仔路点
      expect(dataCount).toBeGreaterThan(20);
    });
  });
});
