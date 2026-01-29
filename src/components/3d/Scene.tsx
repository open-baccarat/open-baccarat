// ============================================
// OpenBaccarat - 3D 场景组件
// ============================================

'use client';

import { Suspense, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment,
  ContactShadows,
  Float,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload
} from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  Vignette,
  ChromaticAberration
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import type { Card as CardType } from '@/types';
import { ResponsiveCamera, useAutoQuality, type QualityLevel } from './ResponsiveCamera';

interface Scene3DProps {
  playerCards?: CardType[];
  bankerCards?: CardType[];
  isAnimating?: boolean;
  quality?: QualityLevel;
}

export function Scene3D({ playerCards = [], bankerCards = [], isAnimating = false, quality }: Scene3DProps) {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const autoQuality = useAutoQuality();
  const finalQuality = quality || autoQuality;
  
  // 根据画质设置像素比
  const pixelRatio = finalQuality === 'ultra' ? 2 : 
                     finalQuality === 'high' ? 1.5 : 
                     finalQuality === 'medium' ? 1.25 : 1;

  // 错误处理和恢复
  const handleError = (err: Error) => {
    console.error('3D Scene Error:', err);
    setError(err.message);
  };

  const handleRetry = () => {
    setError(null);
    setKey(prev => prev + 1);
  };

  // 显示错误状态
  if (error) {
    return (
      <Scene3DError onRetry={handleRetry} />
    );
  }
  
  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950">
      <Canvas 
        key={key}
        shadows={finalQuality !== 'low'}
        dpr={[1, pixelRatio]}
        gl={{ 
          antialias: finalQuality !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
          failIfMajorPerformanceCaveat: false,
        }}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          // 处理 WebGL 上下文丢失
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost');
            setError('WebGL 上下文丢失');
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            handleRetry();
          });
        }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        <Suspense fallback={<LoadingPlaceholder />}>
          <SceneContent 
            playerCards={playerCards} 
            bankerCards={bankerCards}
            isAnimating={isAnimating}
            quality={finalQuality}
          />
        </Suspense>
        
        <Preload all />
      </Canvas>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#333" wireframe />
    </mesh>
  );
}

function SceneContent({ playerCards, bankerCards, isAnimating, quality = 'medium' }: Scene3DProps) {
  const enablePostProcessing = quality === 'high' || quality === 'ultra';
  const shadowMapSize = quality === 'ultra' ? 4096 : quality === 'high' ? 2048 : 1024;
  
  return (
    <>
      {/* 响应式相机 */}
      <ResponsiveCamera enableTransition={true} transitionDuration={0.8} />
      <OrbitControls 
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={20}
      />

      {/* 灯光 */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.5}
        penumbra={0.8}
        intensity={1}
        castShadow={quality !== 'low'}
        shadow-mapSize={shadowMapSize}
      />
      <directionalLight position={[5, 10, 5]} intensity={0.3} />
      
      {/* 辉光效果的光源 */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffd700" />

      {/* 环境 */}
      <Environment preset="night" />
      
      {/* 牌桌 */}
      <BaccaratTable quality={quality} />

      {/* 扑克牌 */}
      <CardPositions playerCards={playerCards || []} bankerCards={bankerCards || []} />

      {/* 阴影 */}
      {quality !== 'low' && (
        <ContactShadows
          position={[0, -0.49, 0]}
          opacity={0.6}
          scale={20}
          blur={quality === 'ultra' ? 3 : 2}
          far={4}
        />
      )}
      
      {/* 后处理效果 */}
      {enablePostProcessing && (
        <EffectComposer>
          <Bloom 
            intensity={0.3}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette
            offset={0.3}
            darkness={0.5}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      )}
      
      {/* Ultra 画质的色差效果 */}
      {quality === 'ultra' && enablePostProcessing && (
        <EffectComposer>
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0005, 0.0005)}
          />
        </EffectComposer>
      )}
    </>
  );
}

function BaccaratTable({ quality = 'medium' }: { quality?: QualityLevel }) {
  return (
    <group>
      {/* 桌面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial 
          color="#1a472a" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* 桌面边框 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <ringGeometry args={[7.8, 8, 64]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* 发牌区域标记 - 庄家 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, -2]}>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial 
          color="#1a3a2a" 
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 发牌区域标记 - 闲家 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 2]}>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial 
          color="#1a2a3a" 
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 文字标签 - 使用3D文本或sprite */}
      <BankerLabel position={[0, 0.1, -3.5]} />
      <PlayerLabel position={[0, 0.1, 3.5]} />
    </group>
  );
}

function BankerLabel({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0} floatIntensity={0.1}>
      <mesh position={position}>
        <boxGeometry args={[1.5, 0.4, 0.05]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </Float>
  );
}

function PlayerLabel({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0} floatIntensity={0.1}>
      <mesh position={position}>
        <boxGeometry args={[1.5, 0.4, 0.05]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
    </Float>
  );
}

function CardPositions({ playerCards, bankerCards }: { playerCards: CardType[]; bankerCards: CardType[] }) {
  return (
    <>
      {/* 庄家牌 */}
      {bankerCards.map((card, index) => (
        <Card3D
          key={`banker-${index}`}
          card={card}
          position={[
            (index - (bankerCards.length - 1) / 2) * 1.2,
            0,
            -2
          ]}
          rotation={[0, 0, 0]}
        />
      ))}

      {/* 闲家牌 */}
      {playerCards.map((card, index) => (
        <Card3D
          key={`player-${index}`}
          card={card}
          position={[
            (index - (playerCards.length - 1) / 2) * 1.2,
            0,
            2
          ]}
          rotation={[0, Math.PI, 0]}
        />
      ))}
    </>
  );
}

interface Card3DProps {
  card: CardType;
  position: [number, number, number];
  rotation: [number, number, number];
}

function Card3D({ card, position, rotation }: Card3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 悬停动画
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  // 获取牌面颜色
  const isRed = card.suit === 'heart' || card.suit === 'diamond';
  
  return (
    <Float speed={2} rotationIntensity={0.02} floatIntensity={0.1}>
      <group position={position} rotation={rotation}>
        {/* 牌的主体 */}
        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[0.9, 0.02, 1.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        
        {/* 牌面装饰 */}
        <mesh position={[0, 0.015, 0]}>
          <planeGeometry args={[0.8, 1.3]} />
          <meshStandardMaterial 
            color={isRed ? '#ff4444' : '#333333'} 
            roughness={0.5}
          />
        </mesh>
      </group>
    </Float>
  );
}

// 3D 场景错误组件
function Scene3DError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('error');
  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl">🎴</div>
        <p className="text-zinc-400">{t('sceneLoadFailed')}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}

// 导出用于动态导入
export default Scene3D;
