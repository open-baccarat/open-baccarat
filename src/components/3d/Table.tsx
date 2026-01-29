// ============================================
// OpenBaccarat - 3D 百家乐赌桌组件
// ============================================

'use client';

import { useMemo } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface TableProps {
  showLabels?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * 百家乐赌桌组件
 * 包含桌面、边框、庄家/闲家区域标记
 */
export function BaccaratTable({ showLabels = true, quality = 'medium' }: TableProps) {
  const segments = quality === 'ultra' ? 64 : quality === 'high' ? 48 : quality === 'medium' ? 32 : 16;
  
  return (
    <group>
      {/* 桌面主体 */}
      <TableSurface segments={segments} />
      
      {/* 桌面边框 */}
      <TableBorder segments={segments} />
      
      {/* 庄家区域 */}
      <DealingArea position={[0, 0.01, -2]} color="#3a1a1a" label="BANKER" labelColor="#dc2626" />
      
      {/* 闲家区域 */}
      <DealingArea position={[0, 0.01, 2]} color="#1a1a3a" label="PLAYER" labelColor="#2563eb" />
      
      {/* 中心分隔线 */}
      <CenterLine />
      
      {/* 文字标签 */}
      {showLabels && (
        <>
          <TableLabel text="庄" position={[-5, 0.02, -2]} color="#dc2626" />
          <TableLabel text="闲" position={[-5, 0.02, 2]} color="#2563eb" />
          <TableLabel text="和" position={[-5, 0.02, 0]} color="#16a34a" />
        </>
      )}
      
      {/* 发牌靴位置标记 */}
      <ShoeMarker position={[6, 0.01, 0]} />
    </group>
  );
}

/**
 * 桌面主体
 */
function TableSurface({ segments }: { segments: number }) {
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(16, 10, segments, segments);
  }, [segments]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color="#1a472a" 
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}

/**
 * 桌面边框
 */
function TableBorder({ segments }: { segments: number }) {
  const borderWidth = 0.3;
  const tableWidth = 16;
  const tableHeight = 10;
  
  // 木纹边框材质
  const borderMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8B4513',
      roughness: 0.6,
      metalness: 0.2,
    });
  }, []);

  return (
    <group position={[0, 0.15, 0]}>
      {/* 顶部边框 */}
      <RoundedBox
        args={[tableWidth + borderWidth * 2, 0.3, borderWidth]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, -tableHeight / 2 - borderWidth / 2]}
        castShadow
      >
        <primitive object={borderMaterial} attach="material" />
      </RoundedBox>
      
      {/* 底部边框 */}
      <RoundedBox
        args={[tableWidth + borderWidth * 2, 0.3, borderWidth]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, tableHeight / 2 + borderWidth / 2]}
        castShadow
      >
        <primitive object={borderMaterial} attach="material" />
      </RoundedBox>
      
      {/* 左侧边框 */}
      <RoundedBox
        args={[borderWidth, 0.3, tableHeight]}
        radius={0.05}
        smoothness={4}
        position={[-tableWidth / 2 - borderWidth / 2, 0, 0]}
        castShadow
      >
        <primitive object={borderMaterial} attach="material" />
      </RoundedBox>
      
      {/* 右侧边框 */}
      <RoundedBox
        args={[borderWidth, 0.3, tableHeight]}
        radius={0.05}
        smoothness={4}
        position={[tableWidth / 2 + borderWidth / 2, 0, 0]}
        castShadow
      >
        <primitive object={borderMaterial} attach="material" />
      </RoundedBox>
      
      {/* 四角装饰 */}
      {([
        [-tableWidth / 2, -tableHeight / 2],
        [tableWidth / 2, -tableHeight / 2],
        [-tableWidth / 2, tableHeight / 2],
        [tableWidth / 2, tableHeight / 2],
      ] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.05, z]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
          <meshStandardMaterial color="#654321" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 发牌区域
 */
function DealingArea({ 
  position, 
  color, 
  label, 
  labelColor 
}: { 
  position: [number, number, number]; 
  color: string; 
  label: string;
  labelColor: string;
}) {
  return (
    <group position={position}>
      {/* 区域背景 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 2.5]} />
        <meshStandardMaterial 
          color={color} 
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* 区域边框 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[2.8, 3, 6]} />
        <meshStandardMaterial 
          color={labelColor} 
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* 区域标签 */}
      <Text
        position={[0, 0.02, 1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color={labelColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {label}
      </Text>
    </group>
  );
}

/**
 * 中心分隔线
 */
function CenterLine() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <planeGeometry args={[14, 0.05]} />
      <meshStandardMaterial 
        color="#ffd700" 
        emissive="#ffd700"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

/**
 * 文字标签
 */
function TableLabel({ 
  text, 
  position, 
  color 
}: { 
  text: string; 
  position: [number, number, number]; 
  color: string;
}) {
  return (
    <Text
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.8}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#000000"
    >
      {text}
    </Text>
  );
}

/**
 * 发牌靴位置标记
 */
function ShoeMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 发牌靴底座 */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 1.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* 发牌靴主体 */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1, 0.4, 1.5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* 牌槽 */}
      <mesh position={[0.3, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 1.2]} />
        <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

export default BaccaratTable;
