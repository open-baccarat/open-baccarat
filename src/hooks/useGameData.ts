// ============================================
// OpenBaccarat - 游戏数据 Hook
// ============================================

'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/game-store';
import { getCurrentShoe, getGameStats, getRoundsHistory, getRoadmapData, subscribeToRounds } from '@/lib/supabase/queries';
import type { Round, Shoe, GameStats, RoadmapPoint } from '@/types';

export function useGameData() {
  const {
    currentShoe,
    stats,
    history,
    roadmapData,
    isLoading,
    error,
    setCurrentShoe,
    setStats,
    setHistory,
    setRoadmapData,
    addToHistory,
    setLoading,
    setError,
  } = useGameStore();

  // 加载当前牌靴信息
  const loadCurrentShoe = useCallback(async () => {
    try {
      const shoe = await getCurrentShoe();
      setCurrentShoe(shoe);
    } catch (err) {
      console.error('加载牌靴失败:', err);
      setError('加载牌靴失败');
    }
  }, [setCurrentShoe, setError]);

  // 加载游戏统计
  const loadStats = useCallback(async () => {
    try {
      const gameStats = await getGameStats();
      setStats(gameStats);
    } catch (err) {
      console.error('加载统计失败:', err);
      setError('加载统计失败');
    }
  }, [setStats, setError]);

  // 加载历史记录
  const loadHistory = useCallback(async (page: number = 1) => {
    try {
      const result = await getRoundsHistory(page);
      setHistory(result.items, result.page, result.totalPages);
    } catch (err) {
      console.error('加载历史失败:', err);
      setError('加载历史失败');
    }
  }, [setHistory, setError]);

  // 加载路单数据
  const loadRoadmapData = useCallback(async (shoeId?: string) => {
    try {
      const data = await getRoadmapData(shoeId);
      setRoadmapData(data);
    } catch (err) {
      console.error('加载路单失败:', err);
      setError('加载路单失败');
    }
  }, [setRoadmapData, setError]);

  // 初始化加载
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 先加载当前牌靴信息
      const shoe = await getCurrentShoe();
      setCurrentShoe(shoe);
      
      // 然后并行加载其他数据（路单按当前牌靴筛选）
      await Promise.all([
        loadStats(),
        loadHistory(),
        loadRoadmapData(shoe?.id), // 传入当前牌靴 ID
      ]);
    } catch (err) {
      console.error('初始化失败:', err);
      setError('初始化失败');
    } finally {
      setLoading(false);
    }
  }, [setCurrentShoe, loadStats, loadHistory, loadRoadmapData, setLoading, setError]);

  // 订阅实时更新
  useEffect(() => {
    const subscription = subscribeToRounds((newRound) => {
      // 新游戏记录到达时更新数据
      addToHistory(newRound);
      loadStats();
      // 使用当前 store 中的牌靴 ID 筛选路单
      const state = useGameStore.getState();
      loadRoadmapData(state.currentShoe?.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [addToHistory, loadStats, loadRoadmapData]);

  // 组件挂载时初始化
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    currentShoe,
    stats,
    history,
    roadmapData,
    isLoading,
    error,
    refresh: initialize,
    loadHistory,
    loadRoadmapData,
  };
}

// 模拟游戏数据（用于演示）
export function useDemoMode() {
  const {
    setCurrentShoe,
    setStats,
    setHistory,
    setRoadmapData,
    setPhase,
    setPlayerCards,
    setBankerCards,
    setCurrentRound,
  } = useGameStore();

  const startDemo = useCallback(() => {
    // 设置模拟牌靴
    const mockShoe: Shoe = {
      id: 'demo-shoe-1',
      shoeNumber: 1,
      deckCount: 8,
      totalCards: 416,
      firstCard: { suit: 'spade', rank: 'K' },
      burnStartCount: 10,
      burnEndCount: 15,
      usableCards: 390,  // 416 - 10(烧牌) - 1(第一张牌) - 15(切牌保留) = 390
      cardsUsed: 210,    // 模拟已使用210张牌
      roundsPlayed: 42,
      shuffleVrfProof: null,
      startedAt: new Date(),
      startedAtUnix: Date.now(),
      endedAt: null,
      endedAtUnix: null,
      solanaSignature: null,
      solanaExplorerUrl: null,
      blockchainStatus: 'pending',
      isActive: true,
    };
    setCurrentShoe(mockShoe);

    // 设置模拟统计
    const mockStats: GameStats = {
      totalRounds: 42,
      bankerWins: 20,
      playerWins: 18,
      ties: 4,
      bankerPairs: 3,
      playerPairs: 2,
    };
    setStats(mockStats);

    // 设置模拟历史
    const mockHistory: Round[] = [
      {
        id: 'round-1',
        shoeId: mockShoe.id,
        shoeNumber: mockShoe.shoeNumber,
        roundNumber: 42,
        playerCards: [
          { suit: 'heart', rank: '7' },
          { suit: 'spade', rank: '2' },
        ],
        bankerCards: [
          { suit: 'diamond', rank: 'K' },
          { suit: 'club', rank: '5' },
          { suit: 'heart', rank: '3' },
        ],
        playerTotal: 9,
        bankerTotal: 8,
        winningTotal: 9,
        result: 'player_win',
        isPair: { player: false, banker: false },
        startedAt: new Date(Date.now() - 30000),
        startedAtUnix: Date.now() - 30000,
        completedAt: new Date(),
        completedAtUnix: Date.now(),
        solanaSignature: '5KtP...abc123',
        solanaExplorerUrl: 'https://solscan.io/tx/5KtP...abc123',
        blockchainStatus: 'confirmed',
      },
    ];
    setHistory(mockHistory, 1, 1);

    // 设置模拟路单
    const mockRoadmap: RoadmapPoint[] = Array.from({ length: 20 }, (_, i) => ({
      result: ['banker_win', 'player_win', 'tie'][Math.floor(Math.random() * 3)] as RoadmapPoint['result'],
      roundId: `round-${i + 1}`,
      roundNumber: i + 1,
      isPair: { player: Math.random() > 0.9, banker: Math.random() > 0.9 },
    }));
    setRoadmapData(mockRoadmap);

    // 设置当前回合显示
    setPhase('result');
    setPlayerCards(mockHistory[0]!.playerCards);
    setBankerCards(mockHistory[0]!.bankerCards);
    setCurrentRound(mockHistory[0]!);
  }, [
    setCurrentShoe,
    setStats,
    setHistory,
    setRoadmapData,
    setPhase,
    setPlayerCards,
    setBankerCards,
    setCurrentRound,
  ]);

  return { startDemo };
}
