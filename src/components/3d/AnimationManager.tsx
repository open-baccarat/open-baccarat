// ============================================
// OpenBaccarat - 动画管理器
// ============================================

'use client';

import { useRef, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import type { Card } from '@/types';

// 动画阶段
export type AnimationPhase = 
  | 'idle'
  | 'shuffling'
  | 'dealing_p1'
  | 'dealing_b1'
  | 'dealing_p2'
  | 'dealing_b2'
  | 'revealing_player'
  | 'revealing_banker'
  | 'dealing_p3'
  | 'dealing_b3'
  | 'result';

// 单张牌的动画状态
interface CardAnimationState {
  id: string;
  card: Card | null;
  position: [number, number, number];
  rotation: [number, number, number];
  isRevealed: boolean;
  isBending: boolean;
  bendProgress: number;
}

// 动画配置
const ANIMATION_CONFIG = {
  dealDuration: 0.6,
  revealDuration: 0.8,
  bendDuration: 1.2,
  resultDuration: 0.5,
  cardSpacing: 1.1,
  playerStartX: -2.5,
  bankerStartX: 2.5,
  tableY: 0.1,
  shoePosition: [0, 0.5, -3] as [number, number, number],
};

/**
 * 动画管理器 Hook
 */
export function useAnimationManager() {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [playerCards, setPlayerCards] = useState<CardAnimationState[]>([]);
  const [bankerCards, setBankerCards] = useState<CardAnimationState[]>([]);
  
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const isAnimatingRef = useRef(false);

  /**
   * 创建牌的初始状态
   */
  const createCardState = useCallback((id: string, card: Card | null): CardAnimationState => {
    return {
      id,
      card,
      position: ANIMATION_CONFIG.shoePosition,
      rotation: [0, Math.PI, 0], // 背面朝上
      isRevealed: false,
      isBending: false,
      bendProgress: 0,
    };
  }, []);

  /**
   * 发牌动画
   */
  const dealCard = useCallback(async (
    target: 'player' | 'banker',
    card: Card,
    index: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      const id = `${target}_${index}`;
      const cardState = createCardState(id, card);
      
      // 计算目标位置
      const baseX = target === 'player' 
        ? ANIMATION_CONFIG.playerStartX 
        : ANIMATION_CONFIG.bankerStartX;
      const targetX = baseX + index * ANIMATION_CONFIG.cardSpacing;
      const targetPosition: [number, number, number] = [targetX, ANIMATION_CONFIG.tableY, 0];
      
      // 更新状态
      if (target === 'player') {
        setPlayerCards(prev => [...prev, cardState]);
      } else {
        setBankerCards(prev => [...prev, cardState]);
      }
      
      // 创建动画
      const tl = gsap.timeline({
        onComplete: () => resolve(),
      });
      
      // 从牌靴飞出
      tl.to({}, {
        duration: ANIMATION_CONFIG.dealDuration,
        onUpdate: function() {
          const progress = this.progress();
          const newPosition: [number, number, number] = [
            gsap.utils.interpolate(ANIMATION_CONFIG.shoePosition[0], targetPosition[0], progress),
            gsap.utils.interpolate(ANIMATION_CONFIG.shoePosition[1], targetPosition[1], easeOutQuad(progress)),
            gsap.utils.interpolate(ANIMATION_CONFIG.shoePosition[2], targetPosition[2], progress),
          ];
          
          if (target === 'player') {
            setPlayerCards(prev => prev.map(c => 
              c.id === id ? { ...c, position: newPosition } : c
            ));
          } else {
            setBankerCards(prev => prev.map(c => 
              c.id === id ? { ...c, position: newPosition } : c
            ));
          }
        },
      });
    });
  }, [createCardState]);

  /**
   * 咪牌（弯曲看牌）动画
   */
  const revealCards = useCallback(async (target: 'player' | 'banker'): Promise<void> => {
    return new Promise((resolve) => {
      const cards = target === 'player' ? playerCards : bankerCards;
      const setCards = target === 'player' ? setPlayerCards : setBankerCards;
      
      // 依次揭开每张牌
      const revealSequence = async () => {
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          if (card) {
            await revealSingleCard(card.id, setCards);
            await new Promise(r => setTimeout(r, 300));
          }
        }
        resolve();
      };
      
      revealSequence();
    });
  }, [playerCards, bankerCards]);

  /**
   * 单张牌的咪牌动画
   */
  const revealSingleCard = useCallback(async (
    cardId: string,
    setCards: React.Dispatch<React.SetStateAction<CardAnimationState[]>>
  ): Promise<void> => {
    return new Promise((resolve) => {
      // 开始弯曲
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, isBending: true } : c
      ));
      
      // 弯曲动画
      const tl = gsap.timeline({
        onComplete: () => {
          // 完成揭示
          setCards(prev => prev.map(c => 
            c.id === cardId ? { 
              ...c, 
              isBending: false, 
              isRevealed: true,
              rotation: [-Math.PI / 2, 0, 0],
            } : c
          ));
          resolve();
        },
      });
      
      // 弯曲进度
      tl.to({}, {
        duration: ANIMATION_CONFIG.bendDuration,
        onUpdate: function() {
          const progress = this.progress();
          const bendCurve = Math.sin(progress * Math.PI); // 先弯后直
          
          setCards(prev => prev.map(c => 
            c.id === cardId ? { ...c, bendProgress: bendCurve } : c
          ));
        },
      });
    });
  }, []);

  /**
   * 重置动画
   */
  const reset = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    setPhase('idle');
    setPlayerCards([]);
    setBankerCards([]);
    isAnimatingRef.current = false;
  }, []);

  /**
   * 播放完整的发牌序列
   */
  const playDealSequence = useCallback(async (
    pCards: Card[],
    bCards: Card[]
  ): Promise<void> => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    reset();
    
    try {
      // 验证至少有2张牌
      if (!pCards[0] || !pCards[1] || !bCards[0] || !bCards[1]) {
        throw new Error('Need at least 2 cards for each hand');
      }
      
      // 发前两张牌 P1 -> B1 -> P2 -> B2
      setPhase('dealing_p1');
      await dealCard('player', pCards[0], 0);
      
      setPhase('dealing_b1');
      await dealCard('banker', bCards[0], 0);
      
      setPhase('dealing_p2');
      await dealCard('player', pCards[1], 1);
      
      setPhase('dealing_b2');
      await dealCard('banker', bCards[1], 1);
      
      // 揭示闲家牌
      setPhase('revealing_player');
      await revealCards('player');
      
      // 揭示庄家牌
      setPhase('revealing_banker');
      await revealCards('banker');
      
      // 如果有第三张牌
      if (pCards[2]) {
        setPhase('dealing_p3');
        await dealCard('player', pCards[2], 2);
        await revealCards('player');
      }
      
      if (bCards[2]) {
        setPhase('dealing_b3');
        await dealCard('banker', bCards[2], 2);
        await revealCards('banker');
      }
      
      setPhase('result');
    } finally {
      isAnimatingRef.current = false;
    }
  }, [reset, dealCard, revealCards]);

  return {
    phase,
    playerCards,
    bankerCards,
    playDealSequence,
    reset,
    isAnimating: isAnimatingRef.current,
  };
}

// 缓动函数
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/**
 * 动画控制器组件（用于调试）
 */
export function AnimationDebugger({
  onPlay,
  onReset,
  phase,
}: {
  onPlay: () => void;
  onReset: () => void;
  phase: AnimationPhase;
}) {
  return (
    <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-sm">
      <div className="mb-2">Phase: <span className="text-emerald-400">{phase}</span></div>
      <div className="flex gap-2">
        <button
          onClick={onPlay}
          className="px-3 py-1 bg-emerald-600 rounded hover:bg-emerald-700"
        >
          Play
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1 bg-zinc-600 rounded hover:bg-zinc-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
