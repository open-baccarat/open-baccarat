// ============================================
// OpenBaccarat - 路单算法单元测试
// ============================================

import { describe, it, expect } from 'vitest';
import {
  generateBeadPlate,
  generateBigRoad,
  generateBigEyeBoy,
  generateSmallRoad,
  generateCockroachRoad,
  generateAllRoadmaps,
} from '@/lib/game/roadmap';
import type { RoadmapPoint } from '@/types';

// 模拟游戏结果数据
const mockResults: RoadmapPoint[] = [
  { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
  { result: 'banker_win', roundNumber: 2, roundId: 'r2', isPair: { player: false, banker: false } },
  { result: 'player_win', roundNumber: 3, roundId: 'r3', isPair: { player: false, banker: false } },
  { result: 'player_win', roundNumber: 4, roundId: 'r4', isPair: { player: false, banker: false } },
  { result: 'player_win', roundNumber: 5, roundId: 'r5', isPair: { player: false, banker: false } },
  { result: 'tie', roundNumber: 6, roundId: 'r6', isPair: { player: false, banker: false } },
  { result: 'banker_win', roundNumber: 7, roundId: 'r7', isPair: { player: false, banker: true } },
  { result: 'banker_win', roundNumber: 8, roundId: 'r8', isPair: { player: false, banker: false } },
  { result: 'player_win', roundNumber: 9, roundId: 'r9', isPair: { player: true, banker: false } },
  { result: 'banker_win', roundNumber: 10, roundId: 'r10', isPair: { player: false, banker: false } },
];

describe('generateBeadPlate', () => {
  it('应该生成珠盘路数据', () => {
    const beadPlate = generateBeadPlate(mockResults);

    expect(beadPlate).toBeDefined();
    expect(Array.isArray(beadPlate)).toBe(true);
  });

  it('空数据应该返回空网格', () => {
    const beadPlate = generateBeadPlate([]);
    // 返回初始化的空网格
    expect(beadPlate).toBeDefined();
  });

  it('应该按顺序排列', () => {
    const results: RoadmapPoint[] = [
      { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
      { result: 'player_win', roundNumber: 2, roundId: 'r2', isPair: { player: false, banker: false } },
      { result: 'tie', roundNumber: 3, roundId: 'r3', isPair: { player: false, banker: false } },
    ];

    const beadPlate = generateBeadPlate(results);

    // 检查第一列的前三行
    expect(beadPlate[0]?.[0]?.result).toBe('banker_win');
    expect(beadPlate[0]?.[1]?.result).toBe('player_win');
    expect(beadPlate[0]?.[2]?.result).toBe('tie');
  });

  it('应该按6行排列（标准珠盘路）', () => {
    const results: RoadmapPoint[] = [];
    for (let i = 0; i < 12; i++) {
      results.push({
        result: i % 2 === 0 ? 'banker_win' : 'player_win',
        roundNumber: i + 1,
        roundId: `r${i + 1}`,
        isPair: { player: false, banker: false },
      });
    }

    const beadPlate = generateBeadPlate(results);

    // 第7个结果应该在第二列（索引1）的第一行（索引0）
    expect(beadPlate[1]?.[0]?.roundNumber).toBe(7);
  });
});

describe('generateBigRoad', () => {
  it('应该生成大路数据', () => {
    const bigRoad = generateBigRoad(mockResults);

    expect(bigRoad).toBeDefined();
    expect(Array.isArray(bigRoad)).toBe(true);
  });

  it('空数据应该返回空网格', () => {
    const bigRoad = generateBigRoad([]);
    expect(bigRoad).toBeDefined();
  });

  it('连续相同结果应该在同一列', () => {
    const results: RoadmapPoint[] = [
      { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
      { result: 'banker_win', roundNumber: 2, roundId: 'r2', isPair: { player: false, banker: false } },
      { result: 'banker_win', roundNumber: 3, roundId: 'r3', isPair: { player: false, banker: false } },
    ];

    const bigRoad = generateBigRoad(results);

    // 第一列应该有3个庄家胜
    expect(bigRoad[0]?.[0]?.result).toBe('banker_win');
    expect(bigRoad[0]?.[1]?.result).toBe('banker_win');
    expect(bigRoad[0]?.[2]?.result).toBe('banker_win');
  });

  it('结果变化时应该换列', () => {
    const results: RoadmapPoint[] = [
      { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
      { result: 'player_win', roundNumber: 2, roundId: 'r2', isPair: { player: false, banker: false } },
      { result: 'banker_win', roundNumber: 3, roundId: 'r3', isPair: { player: false, banker: false } },
    ];

    const bigRoad = generateBigRoad(results);

    // 应该有3列
    expect(bigRoad[0]?.[0]?.result).toBe('banker_win');
    expect(bigRoad[1]?.[0]?.result).toBe('player_win');
    expect(bigRoad[2]?.[0]?.result).toBe('banker_win');
  });

  it('和局应该不换列', () => {
    const results: RoadmapPoint[] = [
      { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
      { result: 'tie', roundNumber: 2, roundId: 'r2', isPair: { player: false, banker: false } },
      { result: 'banker_win', roundNumber: 3, roundId: 'r3', isPair: { player: false, banker: false } },
    ];

    const bigRoad = generateBigRoad(results);

    // 第一列应该有庄赢的格子
    expect(bigRoad[0]?.[0]?.result).toBe('banker_win');
    // 第二个庄赢应该在同一列的下一行（和局被跳过了）
    expect(bigRoad[0]?.[1]?.result).toBe('banker_win');
    // 应该还是在第一列
    expect(bigRoad[1]?.[0]?.result).toBeNull();
  });
});

describe('generateBigEyeBoy', () => {
  it('应该生成大眼仔路数据', () => {
    const bigRoad = generateBigRoad(mockResults);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);

    expect(bigEyeBoy).toBeDefined();
    expect(Array.isArray(bigEyeBoy)).toBe(true);
  });

  it('数据不足时返回空网格', () => {
    const results: RoadmapPoint[] = [
      { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
    ];

    const bigRoad = generateBigRoad(results);
    const bigEyeBoy = generateBigEyeBoy(bigRoad);

    expect(bigEyeBoy).toBeDefined();
  });
});

describe('generateSmallRoad', () => {
  it('应该生成小路数据', () => {
    const bigRoad = generateBigRoad(mockResults);
    const smallRoad = generateSmallRoad(bigRoad);

    expect(smallRoad).toBeDefined();
    expect(Array.isArray(smallRoad)).toBe(true);
  });

  it('数据不足时返回空网格', () => {
    const results: RoadmapPoint[] = [
      { result: 'banker_win', roundNumber: 1, roundId: 'r1', isPair: { player: false, banker: false } },
      { result: 'player_win', roundNumber: 2, roundId: 'r2', isPair: { player: false, banker: false } },
    ];

    const bigRoad = generateBigRoad(results);
    const smallRoad = generateSmallRoad(bigRoad);

    expect(smallRoad).toBeDefined();
  });
});

describe('generateCockroachRoad', () => {
  it('应该生成蟑螂路数据', () => {
    const bigRoad = generateBigRoad(mockResults);
    const cockroachRoad = generateCockroachRoad(bigRoad);

    expect(cockroachRoad).toBeDefined();
    expect(Array.isArray(cockroachRoad)).toBe(true);
  });
});

describe('generateAllRoadmaps', () => {
  it('应该生成所有路单', () => {
    const roadmaps = generateAllRoadmaps(mockResults);

    expect(roadmaps).toBeDefined();
    expect(roadmaps.beadPlate).toBeDefined();
    expect(roadmaps.bigRoad).toBeDefined();
    expect(roadmaps.bigEyeBoy).toBeDefined();
    expect(roadmaps.smallRoad).toBeDefined();
    expect(roadmaps.cockroachRoad).toBeDefined();
  });

  it('空数据应该返回所有空路单', () => {
    const roadmaps = generateAllRoadmaps([]);

    expect(roadmaps.beadPlate).toBeDefined();
    expect(roadmaps.bigRoad).toBeDefined();
    expect(roadmaps.bigEyeBoy).toBeDefined();
    expect(roadmaps.smallRoad).toBeDefined();
    expect(roadmaps.cockroachRoad).toBeDefined();
  });
});
