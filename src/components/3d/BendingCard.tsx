// ============================================
// OpenBaccarat - 弯牌效果（核心卖点！）
// ============================================

'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { Card as CardType } from '@/types';
import { SUIT_NAMES } from '@/lib/game/constants';

// 花色符号
const SUIT_SYMBOLS: Record<CardType['suit'], string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
};

// 花色颜色
const SUIT_COLORS: Record<CardType['suit'], string> = {
  spade: '#1a1a1a',
  heart: '#dc2626',
  diamond: '#dc2626',
  club: '#1a1a1a',
};

interface BendingCardProps {
  card: CardType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isBending?: boolean;
  bendProgress?: number; // 0-1 弯曲程度
  isRevealed?: boolean;
  onBendComplete?: () => void;
}

/**
 * 核心组件：真实的弯牌效果
 * 模拟百家乐中荷官弯曲扑克牌的动作
 */
export function BendingCard({
  card,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isBending = false,
  bendProgress = 0,
  isRevealed = false,
  onBendComplete,
}: BendingCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 创建弯曲的几何体
  const bendGeometry = useMemo(() => {
    const width = 0.9;
    const height = 1.4;
    const segments = 32;
    
    // 创建平面几何体，带有足够的细分用于弯曲
    const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    
    return geometry;
  }, []);

  // 应用弯曲变形
  useFrame(() => {
    if (!meshRef.current) return;
    
    const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
    const positionAttribute = geometry.getAttribute('position');
    
    const width = 0.9;
    const height = 1.4;
    const maxBend = 0.4 * bendProgress; // 最大弯曲程度
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      
      // 沿Y轴方向弯曲（模拟从边缘向上弯）
      const bendFactor = Math.pow((y + height / 2) / height, 2);
      const z = bendFactor * maxBend;
      
      // 边缘额外弯曲
      const edgeBend = Math.abs(x) / (width / 2);
      const additionalBend = edgeBend * bendFactor * maxBend * 0.3;
      
      positionAttribute.setZ(i, z + additionalBend);
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  // 弯牌动画
  useEffect(() => {
    if (!groupRef.current || !isBending) return;

    // 使用 GSAP 创建流畅的弯牌动画
    const tl = gsap.timeline({
      onComplete: () => {
        onBendComplete?.();
      },
    });

    // 抬起
    tl.to(groupRef.current.position, {
      y: position[1] + 0.3,
      duration: 0.3,
      ease: 'power2.out',
    });

    // 弯曲（通过外部 bendProgress 控制）
    // 这里只控制位置和旋转，弯曲在 useFrame 中实时计算

    // 翻转露出点数
    tl.to(groupRef.current.rotation, {
      x: Math.PI * 0.15,
      duration: 0.4,
      ease: 'power2.inOut',
    }, '-=0.1');

    // 放下
    tl.to(groupRef.current.position, {
      y: position[1],
      duration: 0.3,
      ease: 'power2.in',
    });

    tl.to(groupRef.current.rotation, {
      x: 0,
      duration: 0.2,
      ease: 'power2.out',
    }, '-=0.2');

    return () => {
      tl.kill();
    };
  }, [isBending, position, onBendComplete]);

  const isRed = card.suit === 'heart' || card.suit === 'diamond';
  const suitSymbol = SUIT_NAMES[card.suit];

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 牌背面 */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshStandardMaterial 
          color="#1a237e"
          roughness={0.4}
          metalness={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 牌正面（可弯曲） */}
      <mesh 
        ref={meshRef} 
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
      >
        <primitive object={bendGeometry} attach="geometry" />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.3}
          metalness={0.1}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 牌面数字和花色（简化显示） */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.4]} />
        <meshBasicMaterial 
          color={isRed ? '#dc2626' : '#1a1a1a'} 
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 边缘高光 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.92, 0.02, 1.42]} />
        <meshStandardMaterial 
          color="#f0f0f0"
          roughness={0.5}
          metalness={0.2}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

/**
 * 弯牌动画序列
 * 用于控制多张牌的弯曲动画
 */
export function useBendingAnimation() {
  const bendProgressRef = useRef<{ [key: string]: number }>({});
  
  const startBending = (cardId: string, duration: number = 800) => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 缓动函数
        const easedProgress = easeInOutCubic(progress);
        bendProgressRef.current[cardId] = easedProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  };

  const getBendProgress = (cardId: string): number => {
    return bendProgressRef.current[cardId] || 0;
  };

  const resetBending = (cardId: string) => {
    bendProgressRef.current[cardId] = 0;
  };

  return {
    startBending,
    getBendProgress,
    resetBending,
  };
}

// 缓动函数
function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default BendingCard;
