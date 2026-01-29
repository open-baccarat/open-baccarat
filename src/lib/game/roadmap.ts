// ============================================
// OpenBaccarat - 路单算法
// ============================================

import type { RoadmapPoint, GameResult } from '@/types';
import { ROADMAP_CONFIG } from './constants';

// 路单格子类型
export interface RoadmapCell {
  result: GameResult | null;
  roundId: string | null;
  roundNumber: number | null;
  isPair: { player: boolean; banker: boolean } | null;
  isTie: boolean; // 和局在大路中会叠加到前一个格子
  tieCount: number; // 连续和局数量
}

// 珠盘路格子
export interface BeadPlateCell extends RoadmapCell {
  col: number;
  row: number;
}

// 大路格子
export interface BigRoadCell extends RoadmapCell {
  col: number;
  row: number;
  isStreak: boolean; // 是否是连胜
}

/**
 * 生成珠盘路（Bead Plate）
 * 最简单的路单，按顺序从上到下、从左到右排列
 * 当数据超过容量时，显示最新的数据
 */
export function generateBeadPlate(data: RoadmapPoint[]): BeadPlateCell[][] {
  const { columns, rows } = ROADMAP_CONFIG.BEAD_PLATE;
  const capacity = columns * rows;
  const grid: BeadPlateCell[][] = [];
  
  // 如果数据超过容量，只取最新的数据
  const displayData = data.length > capacity ? data.slice(-capacity) : data;
  
  // 初始化网格
  for (let col = 0; col < columns; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col]![row] = {
        result: null,
        roundId: null,
        roundNumber: null,
        isPair: null,
        isTie: false,
        tieCount: 0,
        col,
        row,
      };
    }
  }
  
  // 填充数据（使用截取后的最新数据）
  let index = 0;
  for (let col = 0; col < columns && index < displayData.length; col++) {
    for (let row = 0; row < rows && index < displayData.length; row++) {
      const point = displayData[index]!;
      grid[col]![row] = {
        result: point.result,
        roundId: point.roundId,
        roundNumber: point.roundNumber,
        isPair: point.isPair,
        isTie: point.result === 'tie',
        tieCount: 0,
        col,
        row,
      };
      index++;
    }
  }
  
  return grid;
}

/**
 * 生成大路（Big Road）
 * 庄闲交替时换列，连胜时向下排列
 * 当数据超过显示列数时，显示最新的数据
 */
export function generateBigRoad(data: RoadmapPoint[]): BigRoadCell[][] {
  const { columns: displayColumns, rows } = ROADMAP_CONFIG.BIG_ROAD;
  
  // 使用足够大的列数来容纳所有数据（最坏情况：全部交替 = data.length列）
  const maxColumns = Math.max(displayColumns, data.length);
  const fullGrid: BigRoadCell[][] = [];
  
  // 初始化完整网格
  for (let col = 0; col < maxColumns; col++) {
    fullGrid[col] = [];
    for (let row = 0; row < rows; row++) {
      fullGrid[col]![row] = {
        result: null,
        roundId: null,
        roundNumber: null,
        isPair: null,
        isTie: false,
        tieCount: 0,
        col,
        row,
        isStreak: false,
      };
    }
  }
  
  let currentCol = 0;
  let currentRow = 0;
  let lastResult: GameResult | null = null;
  let lastPlacedCol = -1;
  let lastPlacedRow = -1;
  let maxUsedCol = 0;
  
  for (const point of data) {
    if (point.result === 'tie') {
      if (lastPlacedCol >= 0 && lastPlacedRow >= 0) {
        const cell = fullGrid[lastPlacedCol]?.[lastPlacedRow];
        if (cell) {
          cell.tieCount++;
        }
      }
      continue;
    }
    
    if (lastResult !== null && lastResult !== point.result) {
      currentCol++;
      currentRow = 0;
    } else if (lastResult === point.result) {
      currentRow++;
      if (currentRow >= rows) {
        currentRow = rows - 1;
        currentCol++;
      }
    }
    
    while (fullGrid[currentCol]?.[currentRow]?.result !== null && currentCol < maxColumns) {
      currentCol++;
    }
    
    if (currentCol >= maxColumns) break;
    
    const cell = fullGrid[currentCol]?.[currentRow];
    if (cell) {
      cell.result = point.result;
      cell.roundId = point.roundId;
      cell.roundNumber = point.roundNumber;
      cell.isPair = point.isPair;
      cell.isStreak = currentRow > 0;
      lastPlacedCol = currentCol;
      lastPlacedRow = currentRow;
      maxUsedCol = Math.max(maxUsedCol, currentCol);
    }
    
    lastResult = point.result;
  }
  
  // 如果使用的列数超过显示列数，截取最新的列
  const usedColumns = maxUsedCol + 1;
  const startCol = usedColumns > displayColumns ? usedColumns - displayColumns : 0;
  
  // 创建最终显示网格
  const grid: BigRoadCell[][] = [];
  for (let displayCol = 0; displayCol < displayColumns; displayCol++) {
    const sourceCol = startCol + displayCol;
    grid[displayCol] = [];
    for (let row = 0; row < rows; row++) {
      const sourceCell = fullGrid[sourceCol]?.[row];
      grid[displayCol]![row] = {
        result: sourceCell?.result ?? null,
        roundId: sourceCell?.roundId ?? null,
        roundNumber: sourceCell?.roundNumber ?? null,
        isPair: sourceCell?.isPair ?? null,
        isTie: sourceCell?.isTie ?? false,
        tieCount: sourceCell?.tieCount ?? 0,
        col: displayCol,
        row,
        isStreak: sourceCell?.isStreak ?? false,
      };
    }
  }
  
  return grid;
}

/**
 * 找到某列最后一个有数据的行
 */
function findLastRow(grid: BigRoadCell[][], col: number): number {
  const column = grid[col];
  if (!column) return 0;
  
  for (let row = column.length - 1; row >= 0; row--) {
    if (column[row]?.result !== null) {
      return row;
    }
  }
  return 0;
}

/**
 * 生成大眼仔路（Big Eye Boy）
 * 从大路的第二列第二行开始，或第三列第一行开始
 */
export function generateBigEyeBoy(bigRoad: BigRoadCell[][]): RoadmapCell[][] {
  const { columns, rows } = ROADMAP_CONFIG.BIG_EYE_BOY;
  const grid: RoadmapCell[][] = [];
  
  // 初始化网格
  for (let col = 0; col < columns; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col]![row] = {
        result: null,
        roundId: null,
        roundNumber: null,
        isPair: null,
        isTie: false,
        tieCount: 0,
      };
    }
  }
  
  // 大眼仔路算法
  // 从大路第2列第2行开始，或第3列第1行开始
  // 比较大路中相邻两列的走势
  const results: ('banker_win' | 'player_win')[] = [];
  
  for (let col = 1; col < bigRoad.length; col++) {
    const currentColumn = bigRoad[col];
    const prevColumn = bigRoad[col - 1];
    
    if (!currentColumn || !prevColumn) continue;
    
    for (let row = 0; row < currentColumn.length; row++) {
      const cell = currentColumn[row];
      if (!cell?.result) continue;
      
      // 跳过大路第2列第1行（大眼仔路从第2列第2行开始）
      // 0-indexed: col 1, row 0 应该跳过
      if (col === 1 && row === 0) continue;
      
      let isRed: boolean;
      if (row === 0) {
        // 第一行：比较前两列是否齐脚（长度相等）
        const prev2Column = bigRoad[col - 2];
        if (prev2Column) {
          const prevColLength = getColumnLength(prevColumn);
          const prev2ColLength = getColumnLength(prev2Column);
          isRed = prevColLength === prev2ColLength;
        } else {
          // 如果没有前前列，跳过（不应该发生，因为已跳过col 1, row 0）
          continue;
        }
      } else {
        // 其他行：前一列对应位置是否有值（有值为红，无值为蓝）
        isRed = prevColumn[row]?.result !== null;
      }
      
      results.push(isRed ? 'banker_win' : 'player_win');
    }
  }
  
  // 将结果填入网格
  fillDerivedRoad(grid, results, rows);
  
  return grid;
}

/**
 * 生成小路（Small Road）
 * 从大路的第三列第二行开始，或第四列第一行开始
 */
export function generateSmallRoad(bigRoad: BigRoadCell[][]): RoadmapCell[][] {
  const { columns, rows } = ROADMAP_CONFIG.SMALL_ROAD;
  const grid: RoadmapCell[][] = [];
  
  // 初始化网格
  for (let col = 0; col < columns; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col]![row] = {
        result: null,
        roundId: null,
        roundNumber: null,
        isPair: null,
        isTie: false,
        tieCount: 0,
      };
    }
  }
  
  const results: ('banker_win' | 'player_win')[] = [];
  
  // 小路算法：从大路第3列第2行开始，比较当前列和前两列
  for (let col = 2; col < bigRoad.length; col++) {
    const currentColumn = bigRoad[col];
    const prev2Column = bigRoad[col - 2];
    
    if (!currentColumn || !prev2Column) continue;
    
    for (let row = 0; row < currentColumn.length; row++) {
      const cell = currentColumn[row];
      if (!cell?.result) continue;
      
      // 跳过大路第3列第1行（小路从第3列第2行开始）
      // 0-indexed: col 2, row 0 应该跳过
      if (col === 2 && row === 0) continue;
      
      let isRed: boolean;
      if (row === 0) {
        // 小路 row 0: 比较 col-1 和 col-3 的长度
        const prevColumn = bigRoad[col - 1];
        const prev3Column = bigRoad[col - 3];
        if (prevColumn && prev3Column) {
          const prevColLength = getColumnLength(prevColumn);
          const prev3ColLength = getColumnLength(prev3Column);
          isRed = prevColLength === prev3ColLength;
        } else {
          // 如果没有所需的列，跳过
          continue;
        }
      } else {
        const prev2Cell = prev2Column[row];
        isRed = prev2Cell?.result !== null;
      }
      
      results.push(isRed ? 'banker_win' : 'player_win');
    }
  }
  
  fillDerivedRoad(grid, results, rows);
  
  return grid;
}

/**
 * 生成蟑螂路（Cockroach Road）
 * 从大路的第四列第二行开始，或第五列第一行开始
 */
export function generateCockroachRoad(bigRoad: BigRoadCell[][]): RoadmapCell[][] {
  const { columns, rows } = ROADMAP_CONFIG.COCKROACH_ROAD;
  const grid: RoadmapCell[][] = [];
  
  // 初始化网格
  for (let col = 0; col < columns; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col]![row] = {
        result: null,
        roundId: null,
        roundNumber: null,
        isPair: null,
        isTie: false,
        tieCount: 0,
      };
    }
  }
  
  const results: ('banker_win' | 'player_win')[] = [];
  
  // 蟑螂路算法：从大路第4列第2行开始，比较当前列和前三列
  for (let col = 3; col < bigRoad.length; col++) {
    const currentColumn = bigRoad[col];
    const prev3Column = bigRoad[col - 3];
    
    if (!currentColumn || !prev3Column) continue;
    
    for (let row = 0; row < currentColumn.length; row++) {
      const cell = currentColumn[row];
      if (!cell?.result) continue;
      
      // 跳过大路第4列第1行（蟑螂路从第4列第2行开始）
      // 0-indexed: col 3, row 0 应该跳过
      if (col === 3 && row === 0) continue;
      
      let isRed: boolean;
      if (row === 0) {
        // 蟑螂路 row 0: 比较 col-1 和 col-4 的长度
        const prevColumn = bigRoad[col - 1];
        const prev4Column = bigRoad[col - 4];
        if (prevColumn && prev4Column) {
          const prevColLength = getColumnLength(prevColumn);
          const prev4ColLength = getColumnLength(prev4Column);
          isRed = prevColLength === prev4ColLength;
        } else {
          // 如果没有所需的列，跳过
          continue;
        }
      } else {
        const prev3Cell = prev3Column[row];
        isRed = prev3Cell?.result !== null;
      }
      
      results.push(isRed ? 'banker_win' : 'player_win');
    }
  }
  
  fillDerivedRoad(grid, results, rows);
  
  return grid;
}

/**
 * 获取某列的有效长度
 */
function getColumnLength(column: BigRoadCell[]): number {
  let length = 0;
  for (const cell of column) {
    if (cell.result !== null) {
      length++;
    }
  }
  return length;
}

/**
 * 将结果填入派生路单网格
 * 当结果超过网格容量时，显示最新的结果
 */
function fillDerivedRoad(
  grid: RoadmapCell[][],
  results: ('banker_win' | 'player_win')[],
  maxRows: number
): void {
  const displayColumns = grid.length;
  
  // 先计算需要多少列（填充到一个足够大的虚拟网格）
  const maxColumns = Math.max(displayColumns, results.length);
  const positions: { col: number; row: number; result: 'banker_win' | 'player_win' }[] = [];
  
  let currentCol = 0;
  let currentRow = 0;
  let lastResult: 'banker_win' | 'player_win' | null = null;
  let maxUsedCol = 0;
  
  for (const result of results) {
    if (lastResult !== null && lastResult !== result) {
      currentCol++;
      currentRow = 0;
    } else if (lastResult === result && currentRow < maxRows - 1) {
      currentRow++;
    } else if (currentRow >= maxRows - 1) {
      currentCol++;
    }
    
    positions.push({ col: currentCol, row: currentRow, result });
    maxUsedCol = Math.max(maxUsedCol, currentCol);
    lastResult = result;
  }
  
  // 计算起始列偏移（如果使用的列数超过显示列数）
  const usedColumns = maxUsedCol + 1;
  const startCol = usedColumns > displayColumns ? usedColumns - displayColumns : 0;
  
  // 填充到显示网格
  for (const pos of positions) {
    const displayCol = pos.col - startCol;
    if (displayCol >= 0 && displayCol < displayColumns) {
      const cell = grid[displayCol]?.[pos.row];
      if (cell) {
        cell.result = pos.result;
      }
    }
  }
}

/**
 * 获取所有路单数据
 */
export function generateAllRoadmaps(data: RoadmapPoint[]) {
  const bigRoad = generateBigRoad(data);
  
  return {
    beadPlate: generateBeadPlate(data),
    bigRoad,
    bigEyeBoy: generateBigEyeBoy(bigRoad),
    smallRoad: generateSmallRoad(bigRoad),
    cockroachRoad: generateCockroachRoad(bigRoad),
  };
}
