// ============================================
// OpenBaccarat - 发牌动画组件
// ============================================

'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { Card as CardType } from '@/types';
import { ANIMATION_TIMING } from '@/lib/game/constants';

interface CardAnimationProps {
  card: CardType;
  index: number;
  target: 'player' | 'banker';
  onAnimationComplete?: () => void;
}

/**
 * 单张牌的发牌动画
 */
export function CardDealAnimation({
  card,
  index,
  target,
  onAnimationComplete,
}: CardAnimationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState<'initial' | 'dealing' | 'placed'>('initial');
  
  // 计算目标位置
  const targetZ = target === 'player' ? 2 : -2;
  const targetX = (index - 1) * 1.2; // 根据索引偏移
  
  // 起始位置（牌靴位置）
  const startPosition = { x: -5, y: 2, z: 0 };
  
  // 目标位置
  const endPosition = { x: targetX, y: 0.05, z: targetZ };

  useEffect(() => {
    if (!groupRef.current || phase !== 'initial') return;

    setPhase('dealing');

    const group = groupRef.current;
    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('placed');
        onAnimationComplete?.();
      },
    });

    // 设置初始位置
    group.position.set(startPosition.x, startPosition.y, startPosition.z);
    group.rotation.set(0, Math.PI, 0); // 背面朝上

    // 发牌动画：弧形轨迹
    tl.to(group.position, {
      x: endPosition.x,
      y: endPosition.y + 1, // 中间高度
      z: endPosition.z,
      duration: ANIMATION_TIMING.CARD_DEAL / 1000 * 0.6,
      ease: 'power2.out',
    });

    // 继续下降到桌面
    tl.to(group.position, {
      y: endPosition.y,
      duration: ANIMATION_TIMING.CARD_DEAL / 1000 * 0.4,
      ease: 'bounce.out',
    }, '-=0.1');

    // 翻牌动画（延迟执行）
    tl.to(group.rotation, {
      y: 0,
      duration: ANIMATION_TIMING.CARD_FLIP / 1000,
      ease: 'power2.inOut',
    }, '+=0.2');

    return () => {
      tl.kill();
    };
  }, [phase, startPosition, endPosition, onAnimationComplete]);

  // 悬浮动画（放置后）
  useFrame((state) => {
    if (groupRef.current && phase === 'placed') {
      groupRef.current.position.y = 
        endPosition.y + Math.sin(state.clock.elapsedTime * 2 + index) * 0.01;
    }
  });

  const isRed = card.suit === 'heart' || card.suit === 'diamond';

  return (
    <group ref={groupRef} position={[startPosition.x, startPosition.y, startPosition.z]}>
      {/* 牌背面 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshStandardMaterial
          color="#1a237e"
          roughness={0.4}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 牌正面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.3}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 牌面图案 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <planeGeometry args={[0.7, 1.2]} />
        <meshBasicMaterial
          color={isRed ? '#dc2626' : '#1a1a1a'}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * 发牌序列动画
 * 控制多张牌按顺序发出
 */
interface DealSequenceProps {
  playerCards: CardType[];
  bankerCards: CardType[];
  onComplete?: () => void;
}

export function DealSequence({ playerCards, bankerCards, onComplete }: DealSequenceProps) {
  const [dealIndex, setDealIndex] = useState(0);
  const [dealtCards, setDealtCards] = useState<{
    card: CardType;
    target: 'player' | 'banker';
    index: number;
  }[]>([]);

  // 发牌顺序：闲1-庄1-闲2-庄2-（可能的第三张）
  const dealOrder = [
    ...playerCards.slice(0, 2).map((card, i) => ({ card, target: 'player' as const, sequence: i * 2 })),
    ...bankerCards.slice(0, 2).map((card, i) => ({ card, target: 'banker' as const, sequence: i * 2 + 1 })),
    ...playerCards.slice(2).map((card) => ({ card, target: 'player' as const, sequence: 4 })),
    ...bankerCards.slice(2).map((card) => ({ card, target: 'banker' as const, sequence: 5 })),
  ].sort((a, b) => a.sequence - b.sequence);

  useEffect(() => {
    if (dealIndex >= dealOrder.length) {
      onComplete?.();
      return;
    }

    const current = dealOrder[dealIndex];
    if (!current) return;

    const timer = setTimeout(() => {
      setDealtCards((prev) => [
        ...prev,
        {
          card: current.card,
          target: current.target,
          index: prev.filter((c) => c.target === current.target).length,
        },
      ]);
      setDealIndex((prev) => prev + 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [dealIndex, dealOrder, onComplete]);

  return (
    <group>
      {dealtCards.map((item, i) => (
        <CardDealAnimation
          key={`${item.target}-${item.index}-${i}`}
          card={item.card}
          index={item.index}
          target={item.target}
        />
      ))}
    </group>
  );
}

/**
 * 牌靴组件
 * 显示牌靴位置和剩余牌数
 */
export function CardShoe({ remainingCards = 400 }: { remainingCards?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // 轻微浮动
      meshRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime) * 0.02;
    }
  });

  // 根据剩余牌数调整高度
  const height = Math.max(0.5, (remainingCards / 416) * 2);

  return (
    <Float speed={1} rotationIntensity={0.02} floatIntensity={0.05}>
      <group position={[-5, 0, 0]}>
        {/* 牌靴主体 */}
        <mesh ref={meshRef} position={[0, height / 2, 0]}>
          <boxGeometry args={[1.2, height, 1.8]} />
          <meshStandardMaterial
            color="#8B4513"
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* 牌叠 */}
        <mesh position={[0, height + 0.05, 0]}>
          <boxGeometry args={[0.95, 0.1, 1.5]} />
          <meshStandardMaterial color="#1a237e" roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

export default CardDealAnimation;
