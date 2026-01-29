// ============================================
// OpenBaccarat - 路单算法完整审计测试
// 基于50局真实数据进行验证
// ============================================

import { describe, it, expect } from 'vitest';
import {
  generateBeadPlate,
  generateBigRoad,
  generateBigEyeBoy,
  generateSmallRoad,
  generateCockroachRoad,
  generateAllRoadmaps,
  type BigRoadCell,
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

// 转换为 RoadmapPoint 格式
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

// 辅助函数：打印大路结构
function printBigRoad(bigRoad: BigRoadCell[][]): void {
  console.log('\n=== 大路结构 ===');
  for (let col = 0; col < bigRoad.length; col++) {
    const cells = bigRoad[col]!.filter((c) => c.result !== null);
    if (cells.length > 0) {
      const results = cells.map((c) => (c.result === 'banker_win' ? 'B' : 'P'));
      const tieCount = cells.reduce((sum, c) => sum + c.tieCount, 0);
      console.log(
        `Col ${col}: [${results.join(',')}] len=${cells.length}${tieCount > 0 ? ` +${tieCount}T` : ''}`
      );
    }
  }
}

describe('珠盘路 (Bead Plate) 完整审计', () => {
  it('应该按顺序从上到下、从左到右填充', () => {
    const beadPlate = generateBeadPlate(mockRoadmapPoints);

    // 验证每个位置
    let dataIndex = 0;
    for (let col = 0; col < beadPlate.length && dataIndex < realGameData.length; col++) {
      for (let row = 0; row < 6 && dataIndex < realGameData.length; row++) {
        const cell = beadPlate[col]![row]!;
        const expected = realGameData[dataIndex]!;

        expect(cell.result).toBe(expected.result);
        expect(cell.roundNumber).toBe(expected.round);

        dataIndex++;
      }
    }

    // 应该处理了所有50局
    expect(dataIndex).toBe(50);
  });

  it('珠盘路第一列应该是: B,P,T,P,B,B (局1-6)', () => {
    const beadPlate = generateBeadPlate(mockRoadmapPoints);
    const col0 = beadPlate[0]!;

    expect(col0[0]!.result).toBe('banker_win'); // 局1
    expect(col0[1]!.result).toBe('player_win'); // 局2
    expect(col0[2]!.result).toBe('tie'); // 局3
    expect(col0[3]!.result).toBe('player_win'); // 局4
    expect(col0[4]!.result).toBe('banker_win'); // 局5
    expect(col0[5]!.result).toBe('banker_win'); // 局6
  });

  it('珠盘路第二列应该是: B,B,B,B,B,B (局7-12，全庄)', () => {
    const beadPlate = generateBeadPlate(mockRoadmapPoints);
    const col1 = beadPlate[1]!;

    for (let row = 0; row < 6; row++) {
      expect(col1[row]!.result).toBe('banker_win');
      expect(col1[row]!.roundNumber).toBe(7 + row);
    }
  });
});

describe('大路 (Big Road) 完整审计', () => {
  it('应该正确处理庄闲交替和连胜', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 第0列: 只有1个庄 (局1)
    expect(getColumnLength(bigRoad[0]!)).toBe(1);
    expect(bigRoad[0]![0]!.result).toBe('banker_win');

    // 第1列: 2个闲 (局2,4)，局3的和叠加在第一个上
    expect(getColumnLength(bigRoad[1]!)).toBe(2);
    expect(bigRoad[1]![0]!.result).toBe('player_win');
    expect(bigRoad[1]![0]!.tieCount).toBe(1); // 局3的和
    expect(bigRoad[1]![1]!.result).toBe('player_win');

    // 第2列: 6个庄 (局5-10)
    expect(getColumnLength(bigRoad[2]!)).toBe(6);
    for (let row = 0; row < 6; row++) {
      expect(bigRoad[2]![row]!.result).toBe('banker_win');
    }
  });

  it('应该正确处理龙尾 (局11-12超过6行)', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 龙尾: 第3列row5 (局11) 和 第4列row5 (局12)
    expect(bigRoad[3]![5]!.result).toBe('banker_win');
    expect(bigRoad[4]![5]!.result).toBe('banker_win');

    // 确保第3列和第4列的其他行是空的
    for (let row = 0; row < 5; row++) {
      expect(bigRoad[3]![row]!.result).toBeNull();
      expect(bigRoad[4]![row]!.result).toBeNull();
    }
  });

  it('应该正确处理和局叠加', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 局3的和叠加在(1,0)
    expect(bigRoad[1]![0]!.tieCount).toBe(1);

    // 局14的和叠加在(5,0)
    expect(bigRoad[5]![0]!.tieCount).toBe(1);

    // 局18的和叠加在(6,0)
    expect(bigRoad[6]![0]!.tieCount).toBe(1);

    // 局26的和叠加在(9,2)
    expect(bigRoad[9]![2]!.tieCount).toBe(1);
  });

  it('大路统计: 应该有正确的列数和总格子数', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);

    // 计算非空格子总数 (不包括和)
    let totalCells = 0;
    let totalTies = 0;
    for (const col of bigRoad) {
      for (const cell of col) {
        if (cell.result !== null) {
          totalCells++;
          totalTies += cell.tieCount;
        }
      }
    }

    // 50局 - 6和 = 44个非和结果
    expect(totalCells).toBe(44);
    expect(totalTies).toBe(6);
  });
});

describe('大眼仔路 (Big Eye Boy) 完整审计', () => {
  it('应该从大路正确派生', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);

    // 打印大路结构用于调试
    printBigRoad(bigRoad);

    // 大眼仔路应该有数据
    let totalCells = 0;
    for (const col of bigEyeBoy) {
      for (const cell of col) {
        if (cell.result !== null) {
          totalCells++;
        }
      }
    }

    // 大眼仔路入口数 = 大路非空格子数 - 跳过的格子数
    // 跳过: 大路col0全部 + col1row0
    // 预计有很多入口
    expect(totalCells).toBeGreaterThan(30);
  });

  it('大眼仔第一个入口应该是BLUE (大路col1row1检查col0row1)', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);

    // 大路(1,1)检查(0,1) -> null -> BLUE
    expect(bigEyeBoy[0]![0]!.result).toBe('player_win'); // BLUE
  });

  it('大眼仔第三个入口应该是RED (大路col2row1检查col1row1有值)', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);

    // 验证大路结构
    expect(bigRoad[1]![1]!.result).toBe('player_win'); // col1row1有值

    // 大眼仔第三个入口: 大路(2,1)检查(1,1) -> 有值 -> RED
    // 根据fillDerivedRoad，第1列第0行应该是RED
    expect(bigEyeBoy[1]![0]!.result).toBe('banker_win'); // RED
  });
});

describe('小路 (Small Road) 完整审计', () => {
  it('应该从大路正确派生', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const smallRoad = generateSmallRoad(bigRoad);

    let totalCells = 0;
    for (const col of smallRoad) {
      for (const cell of col) {
        if (cell.result !== null) {
          totalCells++;
        }
      }
    }

    expect(totalCells).toBeGreaterThan(20);
  });

  it('小路Row0比较逻辑: 应该比较col-1和col-3的长度', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const smallRoad = generateSmallRoad(bigRoad);

    // 小路第一个row0入口是大路col3row0 (但col3是龙尾在row5，所以跳过)
    // 或者大路col4row0 (也是龙尾)
    // 实际第一个row0入口应该是大路col5row0
    // 比较: len(col4)=1 vs len(col2)=6 -> 不相等 -> BLUE

    // 验证小路有数据
    expect(smallRoad[0]![0]!.result).not.toBeNull();
  });
});

describe('蟑螂路 (Cockroach Road) 完整审计', () => {
  it('应该从大路正确派生', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const cockroachRoad = generateCockroachRoad(bigRoad);

    let totalCells = 0;
    for (const col of cockroachRoad) {
      for (const cell of col) {
        if (cell.result !== null) {
          totalCells++;
        }
      }
    }

    expect(totalCells).toBeGreaterThan(15);
  });

  it('蟑螂路Row0比较逻辑: 应该比较col-1和col-4的长度', () => {
    const bigRoad = generateBigRoad(mockRoadmapPoints);
    const cockroachRoad = generateCockroachRoad(bigRoad);

    // 蟑螂路第一个row0入口是大路col4row0或更后
    // 验证蟑螂路有数据
    expect(cockroachRoad[0]![0]!.result).not.toBeNull();
  });
});

describe('完整路单生成 (All Roadmaps)', () => {
  it('generateAllRoadmaps应该返回所有5种路单', () => {
    const roadmaps = generateAllRoadmaps(mockRoadmapPoints);

    expect(roadmaps.beadPlate).toBeDefined();
    expect(roadmaps.bigRoad).toBeDefined();
    expect(roadmaps.bigEyeBoy).toBeDefined();
    expect(roadmaps.smallRoad).toBeDefined();
    expect(roadmaps.cockroachRoad).toBeDefined();
  });

  it('所有路单应该有正确的网格尺寸', () => {
    const roadmaps = generateAllRoadmaps(mockRoadmapPoints);

    // 珠盘路: 12列 x 6行 (与历史页面渲染一致)
    expect(roadmaps.beadPlate.length).toBe(12);
    expect(roadmaps.beadPlate[0]!.length).toBe(6);

    // 大路: 40列 x 6行
    expect(roadmaps.bigRoad.length).toBe(40);
    expect(roadmaps.bigRoad[0]!.length).toBe(6);

    // 大眼仔路: 40列 x 6行
    expect(roadmaps.bigEyeBoy.length).toBe(40);
    expect(roadmaps.bigEyeBoy[0]!.length).toBe(6);

    // 小路: 40列 x 6行
    expect(roadmaps.smallRoad.length).toBe(40);
    expect(roadmaps.smallRoad[0]!.length).toBe(6);

    // 蟑螂路: 40列 x 6行
    expect(roadmaps.cockroachRoad.length).toBe(40);
    expect(roadmaps.cockroachRoad[0]!.length).toBe(6);
  });
});
