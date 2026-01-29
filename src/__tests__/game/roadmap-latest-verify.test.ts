// ============================================
// 验证珠盘路显示最新数据
// ============================================

import { describe, it, expect } from 'vitest';
import { generateBeadPlate } from '@/lib/game/roadmap';
import { ROADMAP_CONFIG } from '@/lib/game/constants';
import type { RoadmapPoint, GameResult } from '@/types';

describe('珠盘路显示最新数据验证', () => {
  const { columns, rows } = ROADMAP_CONFIG.BEAD_PLATE;
  const capacity = columns * rows; // 12 * 6 = 72

  it('验证配置正确', () => {
    expect(columns).toBe(12);
    expect(rows).toBe(6);
    expect(capacity).toBe(72);
  });

  it('169局时珠盘路应显示第98-169局', () => {
    // 创建169局测试数据
    const data: RoadmapPoint[] = [];
    for (let i = 1; i <= 169; i++) {
      data.push({
        result: i % 3 === 0 ? 'tie' : (i % 2 === 0 ? 'banker_win' : 'player_win'),
        roundId: `r${i}`,
        roundNumber: i,
        isPair: { player: false, banker: false },
      });
    }

    const grid = generateBeadPlate(data);

    // 珠盘路应该显示第98-169局（最新72局）
    // 第0列第0行应该是第98局
    expect(grid[0]![0]!.roundNumber).toBe(169 - capacity + 1); // 98
    
    // 第11列第5行（最后一个格子）应该是第169局
    expect(grid[11]![5]!.roundNumber).toBe(169);
  });

  it('使用真实数据模式验证最后一列', () => {
    // 模拟最新12局：#169:B, #168:P, #167:B, #166:B, #165:B, #164:B, #163:P, #162:B, #161:B, #160:P, #159:P, #158:P
    // 创建169局数据，最后12局按照真实模式
    const data: RoadmapPoint[] = [];
    
    // 前157局使用交替模式
    for (let i = 1; i <= 157; i++) {
      data.push({
        result: i % 2 === 0 ? 'banker_win' : 'player_win',
        roundId: `r${i}`,
        roundNumber: i,
        isPair: { player: false, banker: false },
      });
    }
    
    // 最后12局：#158:P, #159:P, #160:P, #161:B, #162:B, #163:P, #164:B, #165:B, #166:B, #167:B, #168:P, #169:B
    const last12: GameResult[] = [
      'player_win', 'player_win', 'player_win', // 158, 159, 160
      'banker_win', 'banker_win', // 161, 162
      'player_win', // 163
      'banker_win', 'banker_win', 'banker_win', 'banker_win', // 164, 165, 166, 167
      'player_win', // 168
      'banker_win', // 169
    ];
    
    for (let i = 0; i < 12; i++) {
      data.push({
        result: last12[i]!,
        roundId: `r${158 + i}`,
        roundNumber: 158 + i,
        isPair: { player: false, banker: false },
      });
    }

    const grid = generateBeadPlate(data);

    // 验证第0列第0行是第98局
    expect(grid[0]![0]!.roundNumber).toBe(98);

    // 验证最后一列（第11列）的内容
    // 第11列应该显示第164-169局
    // Row 0: #164 B
    // Row 1: #165 B
    // Row 2: #166 B
    // Row 3: #167 B
    // Row 4: #168 P
    // Row 5: #169 B
    expect(grid[11]![0]!.roundNumber).toBe(164);
    expect(grid[11]![0]!.result).toBe('banker_win');
    
    expect(grid[11]![1]!.roundNumber).toBe(165);
    expect(grid[11]![1]!.result).toBe('banker_win');
    
    expect(grid[11]![2]!.roundNumber).toBe(166);
    expect(grid[11]![2]!.result).toBe('banker_win');
    
    expect(grid[11]![3]!.roundNumber).toBe(167);
    expect(grid[11]![3]!.result).toBe('banker_win');
    
    expect(grid[11]![4]!.roundNumber).toBe(168);
    expect(grid[11]![4]!.result).toBe('player_win');
    
    expect(grid[11]![5]!.roundNumber).toBe(169);
    expect(grid[11]![5]!.result).toBe('banker_win');
  });
});
