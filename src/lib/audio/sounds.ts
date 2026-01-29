// ============================================
// OpenBaccarat - 游戏音效管理
// ============================================

export type SoundType =
  | 'card_deal'     // 发牌
  | 'card_flip'     // 翻牌
  | 'card_slide'    // 牌滑动
  | 'win'           // 赢
  | 'lose'          // 输
  | 'tie'           // 和局
  | 'countdown'     // 倒计时
  | 'new_round'     // 新一局
  | 'chip_place'    // 筹码放置（预留）
  | 'shuffle';      // 洗牌

// 音效 URL 映射（使用 Web Audio API 生成或加载外部文件）
// 由于是演示项目，使用合成音效
const SOUND_CONFIG: Record<SoundType, { frequency: number; duration: number; type: OscillatorType }> = {
  card_deal: { frequency: 800, duration: 0.1, type: 'sine' },
  card_flip: { frequency: 1200, duration: 0.15, type: 'triangle' },
  card_slide: { frequency: 600, duration: 0.08, type: 'sine' },
  win: { frequency: 880, duration: 0.3, type: 'sine' },
  lose: { frequency: 220, duration: 0.3, type: 'sine' },
  tie: { frequency: 440, duration: 0.25, type: 'triangle' },
  countdown: { frequency: 1000, duration: 0.05, type: 'square' },
  new_round: { frequency: 660, duration: 0.2, type: 'sine' },
  chip_place: { frequency: 500, duration: 0.1, type: 'triangle' },
  shuffle: { frequency: 400, duration: 0.5, type: 'sawtooth' },
};

/**
 * 音效管理器
 */
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private initialized: boolean = false;

  /**
   * 初始化音频上下文（需要用户交互后调用）
   */
  initialize(): void {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.initialized = true;
      console.log('音效系统已初始化');
    } catch (error) {
      console.warn('音效系统初始化失败:', error);
    }
  }

  /**
   * 确保音频上下文可用
   */
  private ensureContext(): AudioContext | null {
    if (!this.audioContext) {
      this.initialize();
    }
    
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  /**
   * 播放音效
   */
  play(type: SoundType): void {
    if (!this.enabled) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const config = SOUND_CONFIG[type];
    if (!config) return;

    try {
      this.playTone(ctx, config.frequency, config.duration, config.type);
    } catch (error) {
      console.warn('播放音效失败:', error);
    }
  }

  /**
   * 使用 Web Audio API 播放合成音效
   */
  private playTone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // 音量包络
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  /**
   * 播放发牌音效序列
   */
  playDealSequence(cardCount: number = 4): void {
    if (!this.enabled) return;

    for (let i = 0; i < cardCount; i++) {
      setTimeout(() => this.play('card_deal'), i * 200);
    }
  }

  /**
   * 播放翻牌音效序列
   */
  playFlipSequence(cardCount: number = 2): void {
    if (!this.enabled) return;

    for (let i = 0; i < cardCount; i++) {
      setTimeout(() => this.play('card_flip'), i * 300);
    }
  }

  /**
   * 播放结果音效
   */
  playResult(result: 'player_win' | 'banker_win' | 'tie'): void {
    if (!this.enabled) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    // 根据结果播放不同旋律
    switch (result) {
      case 'player_win':
        this.playWinMelody(ctx);
        break;
      case 'banker_win':
        this.playWinMelody(ctx);
        break;
      case 'tie':
        this.play('tie');
        break;
    }
  }

  /**
   * 播放赢的旋律
   */
  private playWinMelody(ctx: AudioContext): void {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(ctx, freq, 0.15, 'sine');
      }, i * 100);
    });
  }

  /**
   * 播放倒计时音效
   */
  playCountdown(seconds: number): void {
    if (!this.enabled || seconds > 5) return;
    
    this.play('countdown');
  }

  /**
   * 设置是否启用音效
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.initialize();
    }
  }

  /**
   * 获取是否启用音效
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置音量 (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 切换静音
   */
  toggleMute(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// 导出单例
export const soundManager = new SoundManager();

/**
 * React Hook: 使用音效
 */
export function useSoundEffect() {
  return {
    play: (type: SoundType) => soundManager.play(type),
    playDealSequence: (count?: number) => soundManager.playDealSequence(count),
    playFlipSequence: (count?: number) => soundManager.playFlipSequence(count),
    playResult: (result: 'player_win' | 'banker_win' | 'tie') => soundManager.playResult(result),
    playCountdown: (seconds: number) => soundManager.playCountdown(seconds),
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
    isEnabled: () => soundManager.isEnabled(),
    setVolume: (volume: number) => soundManager.setVolume(volume),
    getVolume: () => soundManager.getVolume(),
    toggleMute: () => soundManager.toggleMute(),
    initialize: () => soundManager.initialize(),
  };
}

export default soundManager;
