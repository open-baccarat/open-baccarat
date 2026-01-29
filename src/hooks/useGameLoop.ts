// ============================================
// OpenBaccarat - 游戏循环 Hook
// 实现真正的游戏循环：倒计时 → 发牌动画 → 显示结果 → 新一局
// ============================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';
import { simulateRound } from '@/lib/game/rules';
import { isPair } from '@/lib/game/rules';
import { createShoe as createShoeDeck, shuffleDeck } from '@/lib/game/deck';
import { soundManager } from '@/lib/audio/sounds';
import { 
  createShoe as saveShoeToDb, 
  createRound as saveRoundToDb, 
  updateShoe as updateShoeInDb,
  updateRound as updateRoundInDb,
  getRoundsHistory,
  getCurrentShoe,
  getRoadmapData as fetchRoadmapData,
  getGameStats,
  getUsedCardsByShoe,
} from '@/lib/supabase/queries';
import { config, logConfig } from '@/lib/config';
import { withDatabaseRetry, withBlockchainRetry } from '@/lib/utils/retry';
// Memo 通过 API 路由发送（私钥只在服务端可用）
import type { Card, Round, Shoe, GameStats, RoadmapPoint } from '@/types';

// 游戏配置（从环境变量读取）
const GAME_CONFIG = {
  dealingDelayMs: config.game.dealingDelayMs,
  minResultDisplayMs: 3000,
  clearingLeadTimeMs: config.game.clearingLeadTimeSeconds * 1000,
};

export function useGameLoop() {
  const {
    phase,
    setCurrentShoe,
    setCurrentRound,
    setPhase,
    setPlayerCards,
    setBankerCards,
    setIsAnimating,
    setStats,
    addToHistory,
    updateHistoryItem,
    setRoadmapData,
    setHistory,
  } = useGameStore();

  // 使用 ref 存储可变状态（避免闭包问题）
  const roundNumberRef = useRef(0);
  const shoeCardsRef = useRef<Card[]>([]);
  const shoeRef = useRef<Shoe | null>(null);
  const roadmapRef = useRef<RoadmapPoint[]>([]);
  const isPlayingRef = useRef(false);
  const statsRef = useRef<GameStats>({
    totalRounds: 0,
    bankerWins: 0,
    playerWins: 0,
    ties: 0,
    bankerPairs: 0,
    playerPairs: 0,
  });

  // 初始化牌靴（使用确定性洗牌，支持恢复）
  // shoeId: 可选，如果提供则用于恢复已有牌靴；否则创建新牌靴
  // usedCardsCount: 已使用的牌数量（用于跳过已发的牌）
  const initializeShoe = useCallback((existingShoe?: Shoe, usedCardsCount: number = 0) => {
    const isRecovery = !!existingShoe;
    const shoeId = existingShoe?.id || crypto.randomUUID();
    
    console.log(isRecovery 
      ? `🔄 恢复牌靴 #${existingShoe?.shoeNumber}，已使用 ${usedCardsCount} 张牌...`
      : '🎴 初始化新牌靴...'
    );
    
    // 创建并洗牌（使用牌靴 ID 作为种子，确保可恢复）
    const deck = createShoeDeck(8);
    const shuffled = shuffleDeck(deck, shoeId);
    
    // 模拟烧牌（第一张牌的点数）
    const firstCard = shuffled[0]!;
    const burnCount = existingShoe?.burnStartCount || (
      firstCard.rank === 'A' ? 1 : 
      firstCard.rank === 'K' || firstCard.rank === 'Q' || firstCard.rank === 'J' ? 10 :
      parseInt(firstCard.rank) || 10
    );
    
    // 计算需要跳过的牌数（烧牌 + 已使用的牌）
    const skipCount = burnCount + usedCardsCount;
    shoeCardsRef.current = shuffled.slice(skipCount);
    
    console.log(`📊 牌序状态: 烧牌=${burnCount}, 已使用=${usedCardsCount}, 剩余=${shoeCardsRef.current.length}`);
    
    if (isRecovery && existingShoe) {
      // 恢复已有牌靴
      shoeRef.current = existingShoe;
      setCurrentShoe(existingShoe);
      console.log(`✅ 牌靴 #${existingShoe.shoeNumber} 恢复完成，剩余 ${shoeCardsRef.current.length} 张牌`);
      return;
    }
    
    // 创建新牌靴记录（shoeNumber 由数据库自动生成，这里先设为 0）
    const shoe: Shoe = {
      id: shoeId,
      shoeNumber: 0, // 将由数据库返回后更新
      deckCount: 8,
      totalCards: 416,
      firstCard: { suit: firstCard.suit, rank: firstCard.rank },
      burnStartCount: burnCount,
      burnEndCount: 15,
      usableCards: 416 - burnCount - 15,
      roundsPlayed: 0,
      shuffleVrfProof: shoeId, // 使用牌靴 ID 作为 VRF 证明（确定性洗牌）
      startedAt: new Date(),
      startedAtUnix: Date.now(),
      endedAt: null,
      endedAtUnix: null,
      solanaSignature: null,
      solanaExplorerUrl: null,
      blockchainStatus: 'confirmed',
      isActive: true,
    };
    
    shoeRef.current = shoe;
    setCurrentShoe(shoe);
    // 注意：不要重置 roundNumberRef，让局号全局递增
    // roundNumberRef 在 loadHistoryFromDB 中已从数据库恢复
    // 路单数据不要清空，保留从数据库加载的数据
    // roadmapRef.current = [];  // 已移除
    statsRef.current = {
      totalRounds: 0,
      bankerWins: 0,
      playerWins: 0,
      ties: 0,
      bankerPairs: 0,
      playerPairs: 0,
    };
    setStats({ ...statsRef.current });
    // 路单数据不要清空，保留从数据库加载的数据
    
    // 保存牌靴到数据库（根据配置决定）
    if (config.database.enableWrite) {
      saveShoeToDb(shoe).then((result) => {
        if (result) {
          console.log(`✅ 牌靴已保存到数据库: ${result.id}, 编号 #${result.shoeNumber}`);
          // 更新牌靴编号为数据库返回的值
          if (shoeRef.current) {
            shoeRef.current.shoeNumber = result.shoeNumber;
            setCurrentShoe({ ...shoeRef.current });
          }
        }
      }).catch((err) => {
        console.warn('保存牌靴到数据库失败:', err);
      });
    }
    
    console.log(`✅ 牌靴初始化完成，烧牌 ${burnCount} 张，剩余 ${shoeCardsRef.current.length} 张`);
  }, [setCurrentShoe, setStats]);

  // 执行一局游戏
  const playRound = useCallback(async () => {
    if (isPlayingRef.current) {
      console.log('⚠️ 已有游戏在进行中，跳过');
      return;
    }
    
    isPlayingRef.current = true;
    console.log('🎰 开始新一局...');
    
    // 检查剩余牌数
    if (shoeCardsRef.current.length < 20) {
      console.log('🔄 牌数不足，准备换靴...');
      
      // 先关闭当前牌靴
      if (shoeRef.current) {
        await closeCurrentShoe();
      }
      
      // 创建新牌靴
      initializeShoe();
      await new Promise(r => setTimeout(r, 500));
    }
    
    roundNumberRef.current++;
    const roundNumber = roundNumberRef.current;
    
    // 1. 发牌阶段（牌桌已经在 clearing 阶段清空了）
    setPhase('dealing');
    setIsAnimating(true);
    
    // 先使用规则计算完整结果
    const roundResult = simulateRound(shoeCardsRef.current);
    
    // 从牌堆中移除已使用的牌
    shoeCardsRef.current = shoeCardsRef.current.slice(roundResult.cardsUsed);
    
    // 动画：发闲家第一张
    await new Promise(r => setTimeout(r, GAME_CONFIG.dealingDelayMs));
    soundManager.play('card_deal');
    setPlayerCards([roundResult.playerCards[0]!]);
    
    // 动画：发庄家第一张
    await new Promise(r => setTimeout(r, GAME_CONFIG.dealingDelayMs));
    soundManager.play('card_deal');
    setBankerCards([roundResult.bankerCards[0]!]);
    
    // 动画：发闲家第二张
    await new Promise(r => setTimeout(r, GAME_CONFIG.dealingDelayMs));
    soundManager.play('card_deal');
    setPlayerCards([roundResult.playerCards[0]!, roundResult.playerCards[1]!]);
    
    // 动画：发庄家第二张
    await new Promise(r => setTimeout(r, GAME_CONFIG.dealingDelayMs));
    soundManager.play('card_deal');
    setBankerCards([roundResult.bankerCards[0]!, roundResult.bankerCards[1]!]);
    
    // 如果闲家有第三张牌
    if (roundResult.playerCards.length > 2) {
      await new Promise(r => setTimeout(r, GAME_CONFIG.dealingDelayMs));
      soundManager.play('card_deal');
      setPlayerCards(roundResult.playerCards);
    }
    
    // 如果庄家有第三张牌
    if (roundResult.bankerCards.length > 2) {
      await new Promise(r => setTimeout(r, GAME_CONFIG.dealingDelayMs));
      soundManager.play('card_deal');
      setBankerCards(roundResult.bankerCards);
    }
    
    setIsAnimating(false);
    
    // 2. 显示结果
    await new Promise(r => setTimeout(r, 400));
    setPhase('result');
    
    // 播放结果音效
    soundManager.playResult(roundResult.result);
    
    // 计算对子
    const pairInfo = {
      player: isPair(roundResult.playerCards),
      banker: isPair(roundResult.bankerCards),
    };
    
    // 创建回合记录
    const nowMs = Date.now();
    const round: Round = {
      id: crypto.randomUUID(),
      shoeId: shoeRef.current?.id || 'demo',
      shoeNumber: shoeRef.current?.shoeNumber || 0,
      roundNumber,
      playerCards: roundResult.playerCards,
      bankerCards: roundResult.bankerCards,
      playerTotal: roundResult.playerTotal,
      bankerTotal: roundResult.bankerTotal,
      winningTotal: Math.max(roundResult.playerTotal, roundResult.bankerTotal),
      result: roundResult.result,
      isPair: pairInfo,
      startedAt: new Date(nowMs - 10000),
      startedAtUnix: nowMs - 10000, // Unix 时间戳（毫秒）
      completedAt: new Date(nowMs),
      completedAtUnix: nowMs, // Unix 时间戳（毫秒），与数据库保持一致
      solanaSignature: null, // 等待链上确认后更新
      solanaExplorerUrl: null,
      blockchainStatus: 'pending', // 初始状态为 pending，链上确认后更新为 confirmed
    };
    
    setCurrentRound(round);
    
    // 更新统计
    statsRef.current.totalRounds++;
    if (roundResult.result === 'banker_win') statsRef.current.bankerWins++;
    if (roundResult.result === 'player_win') statsRef.current.playerWins++;
    if (roundResult.result === 'tie') statsRef.current.ties++;
    if (pairInfo.banker) statsRef.current.bankerPairs++;
    if (pairInfo.player) statsRef.current.playerPairs++;
    setStats({ ...statsRef.current });
    
    // 更新路单
    roadmapRef.current.push({
      result: roundResult.result,
      roundId: round.id,
      roundNumber,
      isPair: pairInfo,
    });
    setRoadmapData([...roadmapRef.current]);
    
    // 添加到历史
    addToHistory(round);
    
    // 保存回合到数据库（根据配置决定，带20次重试）
    if (config.database.enableWrite) {
      withDatabaseRetry(
        async () => {
          const id = await saveRoundToDb(round);
          if (!id) {
            throw new Error('保存回合返回空ID');
          }
          console.log(`✅ 回合已保存到数据库: ${id}`);
          return id;
        },
        `保存回合 #${round.roundNumber}`
      ).catch((err) => {
        console.error(`❌ 保存回合 #${round.roundNumber} 最终失败（已重试20次）:`, err);
      });
    }
    
    // 更新牌靴信息
    if (shoeRef.current) {
      const updatedShoe = {
        ...shoeRef.current,
        roundsPlayed: roundNumber,
        usableCards: shoeCardsRef.current.length,
      };
      shoeRef.current = updatedShoe;
      setCurrentShoe(updatedShoe);
      
      // 更新数据库中的牌靴（根据配置决定，带20次重试）
      // 注意：usable_cards 是生成列，不能手动更新
      if (config.database.enableWrite) {
        const shoeId = shoeRef.current.id;
        withDatabaseRetry(
          async () => {
            const success = await updateShoeInDb(shoeId, {
              rounds_played: roundNumber,
            });
            if (!success) {
              throw new Error('更新牌靴返回失败');
            }
            return success;
          },
          `更新牌靴 rounds_played=${roundNumber}`
        ).catch((err) => {
          console.error(`❌ 更新牌靴最终失败（已重试20次）:`, err);
        });
      }
    }
    
    console.log(`✅ 第 ${roundNumber} 局完成: ${roundResult.result} (闲${roundResult.playerTotal}:庄${roundResult.bankerTotal})`);
    
    // 记录到 Solana 链上（通过 API 路由发送，私钥只在服务端）
    // 使用重试机制确保链上记录成功
    if (config.blockchain.enableMemo) {
      const roundData = {
        id: round.id,
        shoeId: round.shoeId,
        roundNumber: round.roundNumber,
        result: round.result,
        playerCards: round.playerCards,
        bankerCards: round.bankerCards,
        playerTotal: round.playerTotal,
        bankerTotal: round.bankerTotal,
        isPair: round.isPair,
        completedAtUnix: round.completedAtUnix,
      };
      
      withBlockchainRetry(
        async () => {
          const res = await fetch('/api/memo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roundData),
          });
          
          const result = await res.json();
          
          if (!result.success) {
            // 如果是速率限制，等待后重试
            if (result.code === 'RATE_LIMITED' && result.retryAfter) {
              throw new Error(`速率限制，需等待 ${result.retryAfter} 秒`);
            }
            throw new Error(result.error || '链上记录失败');
          }
          
          return result;
        },
        `链上记录回合 #${round.roundNumber}`
      )
        .then((result) => {
          if (result.signature) {
            console.log(`⛓️ 已上链: ${result.explorerUrl}`);
            // 更新 round 的链上信息
            round.solanaSignature = result.signature;
            round.solanaExplorerUrl = result.explorerUrl;
            round.blockchainStatus = 'confirmed';
            setCurrentRound({ ...round });
            // 更新历史记录中的链上信息（不是添加新记录）
            updateHistoryItem(round.id, {
              solanaSignature: result.signature,
              solanaExplorerUrl: result.explorerUrl,
              blockchainStatus: 'confirmed',
            });
            
            // 更新数据库中的链上信息
            if (config.database.enableWrite) {
              updateRoundInDb(round.id, {
                solana_signature: result.signature,
                solana_explorer_url: result.explorerUrl,
                blockchain_status: 'confirmed',
              });
            }
          }
        })
        .catch((err) => {
          console.error(`❌ 链上记录回合 #${round.roundNumber} 最终失败（已重试10次）:`, err);
          // 标记为失败状态
          round.blockchainStatus = 'failed';
          setCurrentRound({ ...round });
          updateHistoryItem(round.id, {
            blockchainStatus: 'failed',
          });
        });
    }
    
    // 3. 至少显示结果一段时间
    await new Promise(r => setTimeout(r, GAME_CONFIG.minResultDisplayMs));
    
    // 4. 进入等待下一局（等待到整分钟）
    setPhase('waiting');
    isPlayingRef.current = false;
    
  }, [
    initializeShoe,
    setPhase,
    setIsAnimating,
    setPlayerCards,
    setBankerCards,
    setCurrentRound,
    setStats,
    addToHistory,
    updateHistoryItem,
    setRoadmapData,
    setCurrentShoe,
  ]);

  // 从数据库加载历史数据
  const loadHistoryFromDB = useCallback(async () => {
    console.log('📚 从数据库加载历史记录...');
    
    try {
      // 加载历史记录
      const historyResult = await getRoundsHistory(1, 100);
      console.log('📚 历史数据:', historyResult);
      if (historyResult.items.length > 0) {
        console.log('📚 第一条记录:', historyResult.items[0]);
        setHistory(historyResult.items, 1, historyResult.totalPages);
        console.log(`✅ 已加载 ${historyResult.items.length} 条历史记录`);
        
        // 从历史记录中找出最大局号，继续递增
        const maxRoundNumber = Math.max(...historyResult.items.map(r => r.roundNumber));
        roundNumberRef.current = maxRoundNumber;
        console.log(`📊 从历史恢复局号: 当前最大 #${maxRoundNumber}，下一局 #${maxRoundNumber + 1}`);
      }
      
      // 从数据库视图 game_stats 获取统计数据（确保数据准确）
      const dbStats = await getGameStats();
      if (dbStats) {
        setStats(dbStats);
        statsRef.current = dbStats;
        console.log(`✅ 已加载统计数据: 共 ${dbStats.totalRounds} 局`);
      }
      
      // 加载当前牌靴（用于显示牌靴编号，但局号已经从历史记录恢复）
      const currentShoeData = await getCurrentShoe();
      if (currentShoeData) {
        console.log(`✅ 已加载当前牌靴 #${currentShoeData.shoeNumber}`);
        setCurrentShoe(currentShoeData);
        // 保存到 ref 供后续使用
        shoeRef.current = currentShoeData;
      }
      
      // 加载路单数据（按当前牌靴筛选）
      const roadmapPoints = await fetchRoadmapData(currentShoeData?.id);
      if (roadmapPoints.length > 0) {
        roadmapRef.current = roadmapPoints;
        setRoadmapData(roadmapPoints);
        console.log(`✅ 已加载 ${roadmapPoints.length} 条路单数据（牌靴: ${currentShoeData?.id || '全部'}）`);
      }
    } catch (error) {
      console.warn('⚠️ 加载历史数据失败:', error);
    }
  }, [setHistory, setStats, setCurrentShoe]);

  // 关闭当前牌靴
  const closeCurrentShoe = useCallback(async () => {
    if (!shoeRef.current || !config.database.enableWrite) return;
    
    const shoeId = shoeRef.current.id;
    const now = new Date();
    
    console.log(`🔒 关闭牌靴 #${shoeRef.current.shoeNumber}...`);
    
    try {
      await withDatabaseRetry(
        async () => {
          const success = await updateShoeInDb(shoeId, {
            ended_at: now.toISOString(),
            ended_at_unix: Date.now(),
          });
          if (!success) {
            throw new Error('关闭牌靴返回失败');
          }
          return success;
        },
        `关闭牌靴 #${shoeRef.current?.shoeNumber}`
      );
      console.log(`✅ 牌靴 #${shoeRef.current?.shoeNumber} 已关闭`);
    } catch (err) {
      console.error('❌ 关闭牌靴失败:', err);
    }
  }, []);

  // 游戏循环控制
  const startGameLoop = useCallback(async () => {
    console.log('🎮 启动游戏循环...');
    
    // 输出当前配置
    logConfig();
    
    // 从数据库加载历史数据（断点续传）
    if (config.database.enableWrite) {
      await loadHistoryFromDB();
    }
    
    // 检查是否有活动牌靴
    if (shoeRef.current && shoeRef.current.isActive) {
      console.log(`🔍 发现活动牌靴 #${shoeRef.current.shoeNumber}，尝试恢复牌序...`);
      
      try {
        // 获取已使用的牌数量
        const usedCards = await getUsedCardsByShoe(shoeRef.current.id);
        const usedCardsCount = usedCards.length;
        
        console.log(`📊 牌靴 #${shoeRef.current.shoeNumber} 已使用 ${usedCardsCount} 张牌`);
        
        // 使用确定性洗牌恢复牌序（牌靴 ID 作为种子）
        initializeShoe(shoeRef.current, usedCardsCount);
        
        console.log(`✅ 成功恢复活动牌靴 #${shoeRef.current.shoeNumber}`);
      } catch (err) {
        console.error('❌ 恢复牌靴失败，创建新牌靴:', err);
        // 关闭当前牌靴
        await closeCurrentShoe();
        shoeRef.current = null;
        // 创建新牌靴
        initializeShoe();
      }
    } else {
      // 没有活动牌靴，创建新的
      initializeShoe();
    }
    
    // 初始化音效
    soundManager.initialize();
    
    // 设置等待状态，等待到整分钟后开始第一局
    setPhase('waiting');
    
  }, [initializeShoe, setPhase, loadHistoryFromDB, closeCurrentShoe]);

  // 计算到下一个整分钟的毫秒数
  const getMillisecondsToNextMinute = useCallback(() => {
    const now = new Date();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    // 如果刚好在整分钟的前2秒内，等待到下下个整分钟
    if (seconds >= 58) {
      return (60 - seconds) * 1000 + (60 * 1000) - milliseconds;
    }
    return (60 - seconds) * 1000 - milliseconds;
  }, []);

  // 清场：清空牌面，准备下一局
  const clearTable = useCallback(() => {
    console.log('🧹 清场准备...');
    setPhase('clearing');
    setPlayerCards([]);
    setBankerCards([]);
    setCurrentRound(null);
  }, [setPhase, setPlayerCards, setBankerCards, setCurrentRound]);

  // 用于保存发牌定时器引用
  const dealTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 监听阶段变化
  useEffect(() => {
    if (phase === 'waiting') {
      const msToNextMinute = getMillisecondsToNextMinute();
      const msToClearing = Math.max(0, msToNextMinute - GAME_CONFIG.clearingLeadTimeMs);
      
      console.log(`⏳ ${Math.ceil(msToClearing / 1000)} 秒后清场，${Math.ceil(msToNextMinute / 1000)} 秒后开始下一局...`);
      
      // 定时器1：提前10秒清场（只改变显示状态）
      const clearingTimer = setTimeout(() => {
        clearTable();
      }, msToClearing);
      
      // 定时器2：整分钟开始发牌（保存到 ref，避免被清除）
      dealTimerRef.current = setTimeout(() => {
        playRound();
      }, msToNextMinute);
      
      return () => {
        clearTimeout(clearingTimer);
        // 不清除 dealTimerRef，让发牌定时器继续运行
      };
    }
    
    // 组件卸载时清除发牌定时器
    return () => {
      if (dealTimerRef.current) {
        clearTimeout(dealTimerRef.current);
        dealTimerRef.current = null;
      }
    };
  }, [phase, playRound, clearTable, getMillisecondsToNextMinute]);

  return {
    startGameLoop,
    playRound,
    initializeShoe,
  };
}
