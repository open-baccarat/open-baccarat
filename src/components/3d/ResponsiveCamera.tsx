// ============================================
// OpenBaccarat - 响应式 3D 摄像机
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';

// 摄像机配置
interface CameraConfig {
  position: [number, number, number];
  fov: number;
  near: number;
  far: number;
}

// 不同设备的摄像机配置
const CAMERA_CONFIGS: Record<'desktop' | 'tablet' | 'mobile', CameraConfig> = {
  desktop: {
    position: [0, 6, 8],
    fov: 45,
    near: 0.1,
    far: 100,
  },
  tablet: {
    position: [0, 7, 10],
    fov: 50,
    near: 0.1,
    far: 100,
  },
  mobile: {
    position: [0, 8, 12],
    fov: 55,
    near: 0.1,
    far: 100,
  },
};

// 断点
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

/**
 * 获取当前设备类型
 */
function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

interface ResponsiveCameraProps {
  enableTransition?: boolean;
  transitionDuration?: number;
}

/**
 * 响应式 3D 摄像机组件
 * 根据屏幕大小自动调整摄像机参数
 */
export function ResponsiveCamera({
  enableTransition = true,
  transitionDuration = 0.8,
}: ResponsiveCameraProps) {
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { camera } = useThree();
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const newDeviceType = getDeviceType();
      if (newDeviceType !== deviceType) {
        setDeviceType(newDeviceType);
      }
    };
    
    // 初始化
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceType]);
  
  // 摄像机参数变化时平滑过渡
  useEffect(() => {
    const config = CAMERA_CONFIGS[deviceType];
    
    if (enableTransition && camera instanceof THREE.PerspectiveCamera) {
      // 位置过渡
      gsap.to(camera.position, {
        x: config.position[0],
        y: config.position[1],
        z: config.position[2],
        duration: transitionDuration,
        ease: 'power2.inOut',
      });
      
      // FOV 过渡
      gsap.to(camera, {
        fov: config.fov,
        duration: transitionDuration,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.updateProjectionMatrix();
        },
      });
    } else if (camera instanceof THREE.PerspectiveCamera) {
      // 直接设置
      camera.position.set(...config.position);
      camera.fov = config.fov;
      camera.updateProjectionMatrix();
    }
  }, [deviceType, camera, enableTransition, transitionDuration]);
  
  const config = CAMERA_CONFIGS[deviceType];
  
  return (
    <PerspectiveCamera
      makeDefault
      position={config.position}
      fov={config.fov}
      near={config.near}
      far={config.far}
    />
  );
}

/**
 * 画质设置
 */
export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

interface QualityConfig {
  pixelRatio: number;
  shadows: boolean;
  antialias: boolean;
  cardSegments: number;
  postProcessing: boolean;
}

const QUALITY_CONFIGS: Record<QualityLevel, QualityConfig> = {
  low: {
    pixelRatio: 1,
    shadows: false,
    antialias: false,
    cardSegments: 16,
    postProcessing: false,
  },
  medium: {
    pixelRatio: 1.5,
    shadows: true,
    antialias: true,
    cardSegments: 32,
    postProcessing: false,
  },
  high: {
    pixelRatio: 2,
    shadows: true,
    antialias: true,
    cardSegments: 48,
    postProcessing: true,
  },
  ultra: {
    pixelRatio: window?.devicePixelRatio || 2,
    shadows: true,
    antialias: true,
    cardSegments: 64,
    postProcessing: true,
  },
};

/**
 * 根据设备性能自动选择画质
 */
export function useAutoQuality(): QualityLevel {
  const [quality, setQuality] = useState<QualityLevel>('medium');
  
  useEffect(() => {
    // 简单的性能检测
    const deviceType = getDeviceType();
    const isMobile = deviceType === 'mobile';
    const isTablet = deviceType === 'tablet';
    
    // 检查 GPU 性能（简化版）
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    let gpuInfo = '';
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
    
    // 根据设备和 GPU 选择画质
    if (isMobile) {
      setQuality('low');
    } else if (isTablet) {
      setQuality('medium');
    } else if (gpuInfo.toLowerCase().includes('nvidia') || 
               gpuInfo.toLowerCase().includes('amd')) {
      setQuality('high');
    } else {
      setQuality('medium');
    }
  }, []);
  
  return quality;
}

/**
 * 获取画质配置
 */
export function useQualityConfig(level?: QualityLevel): QualityConfig {
  const autoLevel = useAutoQuality();
  const finalLevel = level || autoLevel;
  return QUALITY_CONFIGS[finalLevel];
}

/**
 * 降级渲染 Hook
 * 当 FPS 过低时自动降级
 */
export function useAdaptiveQuality(
  initialQuality: QualityLevel = 'high',
  minFps: number = 30
) {
  const [quality, setQuality] = useState<QualityLevel>(initialQuality);
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;
    
    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const currentFps = frameCount;
        setFps(currentFps);
        
        // 自动降级
        if (currentFps < minFps) {
          setQuality((prev: QualityLevel): QualityLevel => {
            const levels: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];
            const currentIndex = levels.indexOf(prev);
            if (currentIndex > 0) {
              return levels[currentIndex - 1] as QualityLevel;
            }
            return prev;
          });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFps);
    };
    
    animationId = requestAnimationFrame(measureFps);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [minFps]);
  
  return { quality, fps, config: QUALITY_CONFIGS[quality] };
}
