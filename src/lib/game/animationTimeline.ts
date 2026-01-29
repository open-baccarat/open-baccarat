// ============================================
// OpenBaccarat - 动画时间线管理器
// ============================================

import { gsap } from 'gsap';

export type AnimationPhase = 
  | 'idle'
  | 'shuffle'
  | 'deal_player_1'
  | 'deal_banker_1'
  | 'deal_player_2'
  | 'deal_banker_2'
  | 'peek_player'
  | 'peek_banker'
  | 'draw_player'
  | 'draw_banker'
  | 'reveal'
  | 'result';

interface AnimationConfig {
  dealDuration: number;
  peekDuration: number;
  revealDuration: number;
  pauseBetweenCards: number;
  resultDisplayDuration: number;
}

const DEFAULT_CONFIG: AnimationConfig = {
  dealDuration: 0.5,
  peekDuration: 1.5,
  revealDuration: 0.8,
  pauseBetweenCards: 0.3,
  resultDisplayDuration: 3,
};

/**
 * 动画时间线管理器
 * 管理整个游戏的动画序列
 */
export class AnimationTimelineManager {
  private timeline: gsap.core.Timeline | null = null;
  private config: AnimationConfig;
  private currentPhase: AnimationPhase = 'idle';
  private onPhaseChange?: (phase: AnimationPhase) => void;
  private isPaused: boolean = false;
  private speed: number = 1;

  constructor(config: Partial<AnimationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 设置阶段变化回调
   */
  setOnPhaseChange(callback: (phase: AnimationPhase) => void) {
    this.onPhaseChange = callback;
  }

  /**
   * 设置动画速度
   */
  setSpeed(speed: number) {
    this.speed = Math.max(0.25, Math.min(4, speed));
    if (this.timeline) {
      this.timeline.timeScale(this.speed);
    }
  }

  /**
   * 获取当前速度
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * 创建完整的发牌动画时间线
   */
  createDealingTimeline(
    callbacks: {
      onDealPlayerCard1?: () => void;
      onDealBankerCard1?: () => void;
      onDealPlayerCard2?: () => void;
      onDealBankerCard2?: () => void;
      onPeekPlayer?: () => void;
      onPeekBanker?: () => void;
      onDrawPlayer?: () => void;
      onDrawBanker?: () => void;
      onReveal?: () => void;
      onResult?: () => void;
      onComplete?: () => void;
    },
    options: {
      hasPlayerThird?: boolean;
      hasBankerThird?: boolean;
    } = {}
  ): gsap.core.Timeline {
    // 清除现有时间线
    this.kill();

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.setPhase('idle');
        callbacks.onComplete?.();
      },
    });

    // 发闲家第一张牌
    tl.call(() => {
      this.setPhase('deal_player_1');
      callbacks.onDealPlayerCard1?.();
    })
    .to({}, { duration: this.config.dealDuration })
    .to({}, { duration: this.config.pauseBetweenCards });

    // 发庄家第一张牌
    tl.call(() => {
      this.setPhase('deal_banker_1');
      callbacks.onDealBankerCard1?.();
    })
    .to({}, { duration: this.config.dealDuration })
    .to({}, { duration: this.config.pauseBetweenCards });

    // 发闲家第二张牌
    tl.call(() => {
      this.setPhase('deal_player_2');
      callbacks.onDealPlayerCard2?.();
    })
    .to({}, { duration: this.config.dealDuration })
    .to({}, { duration: this.config.pauseBetweenCards });

    // 发庄家第二张牌
    tl.call(() => {
      this.setPhase('deal_banker_2');
      callbacks.onDealBankerCard2?.();
    })
    .to({}, { duration: this.config.dealDuration })
    .to({}, { duration: this.config.pauseBetweenCards });

    // 咪牌 - 闲家
    tl.call(() => {
      this.setPhase('peek_player');
      callbacks.onPeekPlayer?.();
    })
    .to({}, { duration: this.config.peekDuration });

    // 咪牌 - 庄家
    tl.call(() => {
      this.setPhase('peek_banker');
      callbacks.onPeekBanker?.();
    })
    .to({}, { duration: this.config.peekDuration });

    // 闲家补牌（如果需要）
    if (options.hasPlayerThird) {
      tl.call(() => {
        this.setPhase('draw_player');
        callbacks.onDrawPlayer?.();
      })
      .to({}, { duration: this.config.dealDuration + this.config.peekDuration });
    }

    // 庄家补牌（如果需要）
    if (options.hasBankerThird) {
      tl.call(() => {
        this.setPhase('draw_banker');
        callbacks.onDrawBanker?.();
      })
      .to({}, { duration: this.config.dealDuration + this.config.peekDuration });
    }

    // 翻牌揭示
    tl.call(() => {
      this.setPhase('reveal');
      callbacks.onReveal?.();
    })
    .to({}, { duration: this.config.revealDuration });

    // 显示结果
    tl.call(() => {
      this.setPhase('result');
      callbacks.onResult?.();
    })
    .to({}, { duration: this.config.resultDisplayDuration });

    this.timeline = tl;
    tl.timeScale(this.speed);

    return tl;
  }

  /**
   * 播放时间线
   */
  play() {
    if (this.timeline) {
      this.isPaused = false;
      this.timeline.play();
    }
  }

  /**
   * 暂停时间线
   */
  pause() {
    if (this.timeline) {
      this.isPaused = true;
      this.timeline.pause();
    }
  }

  /**
   * 恢复时间线
   */
  resume() {
    if (this.timeline && this.isPaused) {
      this.isPaused = false;
      this.timeline.resume();
    }
  }

  /**
   * 停止并重置时间线
   */
  reset() {
    if (this.timeline) {
      this.timeline.pause();
      this.timeline.seek(0);
      this.setPhase('idle');
    }
  }

  /**
   * 销毁时间线
   */
  kill() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.setPhase('idle');
  }

  /**
   * 跳转到指定进度
   */
  seek(progress: number) {
    if (this.timeline) {
      const duration = this.timeline.duration();
      this.timeline.seek(duration * Math.max(0, Math.min(1, progress)));
    }
  }

  /**
   * 获取当前进度
   */
  getProgress(): number {
    if (this.timeline) {
      return this.timeline.progress();
    }
    return 0;
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase(): AnimationPhase {
    return this.currentPhase;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this.timeline?.isActive() ?? false;
  }

  /**
   * 是否已暂停
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * 设置当前阶段
   */
  private setPhase(phase: AnimationPhase) {
    if (this.currentPhase !== phase) {
      this.currentPhase = phase;
      this.onPhaseChange?.(phase);
    }
  }
}

/**
 * 创建单卡动画
 */
export function createCardDealAnimation(
  element: HTMLElement | object,
  from: { x: number; y: number; z: number; rotationY: number },
  to: { x: number; y: number; z: number; rotationY: number },
  duration: number = 0.5
): gsap.core.Tween {
  return gsap.fromTo(
    element,
    {
      x: from.x,
      y: from.y,
      z: from.z,
      rotationY: from.rotationY,
    },
    {
      x: to.x,
      y: to.y,
      z: to.z,
      rotationY: to.rotationY,
      duration,
      ease: 'power2.out',
    }
  );
}

/**
 * 创建咪牌动画
 */
export function createPeekAnimation(
  element: HTMLElement | object,
  bendAmount: { value: number },
  duration: number = 1.5
): gsap.core.Timeline {
  const tl = gsap.timeline();
  
  // 慢慢弯折
  tl.to(bendAmount, {
    value: 0.3,
    duration: duration * 0.4,
    ease: 'power2.inOut',
  })
  // 保持弯折状态
  .to({}, { duration: duration * 0.2 })
  // 放平
  .to(bendAmount, {
    value: 0,
    duration: duration * 0.4,
    ease: 'power2.out',
  });

  return tl;
}

/**
 * 创建翻牌动画
 */
export function createFlipAnimation(
  element: HTMLElement | object,
  duration: number = 0.8
): gsap.core.Tween {
  return gsap.to(element, {
    rotationY: 180,
    duration,
    ease: 'power2.inOut',
  });
}

/**
 * 创建结果高亮动画
 */
export function createResultHighlightAnimation(
  winnerElements: (HTMLElement | object)[],
  loserElements: (HTMLElement | object)[],
  duration: number = 0.5
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // 赢家发光
  tl.to(winnerElements, {
    scale: 1.1,
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
    duration,
    ease: 'power2.out',
  }, 0);

  // 输家变暗
  tl.to(loserElements, {
    opacity: 0.5,
    scale: 0.95,
    duration,
    ease: 'power2.out',
  }, 0);

  return tl;
}

// 导出单例
export const animationManager = new AnimationTimelineManager();
