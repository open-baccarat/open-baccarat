// ============================================
// OpenBaccarat - 音效控制组件
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { soundManager } from '@/lib/audio/sounds';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SoundControlProps {
  className?: string;
  showVolume?: boolean;
}

export function SoundControl({ className, showVolume = false }: SoundControlProps) {
  const t = useTranslations('common');
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [initialized, setInitialized] = useState(false);

  // 从 localStorage 恢复状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEnabled = localStorage.getItem('sound_enabled');
      const storedVolume = localStorage.getItem('sound_volume');
      
      if (storedEnabled !== null) {
        const isEnabled = storedEnabled === 'true';
        setEnabled(isEnabled);
        soundManager.setEnabled(isEnabled);
      }
      
      if (storedVolume !== null) {
        const vol = parseFloat(storedVolume);
        setVolume(vol);
        soundManager.setVolume(vol);
      }
    }
  }, []);

  // 第一次用户交互时初始化音频
  const handleFirstInteraction = useCallback(() => {
    if (!initialized) {
      soundManager.initialize();
      setInitialized(true);
    }
  }, [initialized]);

  const toggleSound = useCallback(() => {
    handleFirstInteraction();
    const newState = soundManager.toggleMute();
    setEnabled(newState);
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_enabled', String(newState));
    }
  }, [handleFirstInteraction]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_volume', String(newVolume));
    }
  }, []);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSound}
        className="text-zinc-400 hover:text-white hover:bg-zinc-800 px-2"
        title={enabled ? t('mute') : t('unmute')}
      >
        {enabled ? (
          <SoundOnIcon className="w-4 h-4" />
        ) : (
          <SoundOffIcon className="w-4 h-4" />
        )}
      </Button>
      
      {showVolume && enabled && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-14 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          title={`${Math.round(volume * 100)}%`}
        />
      )}
    </div>
  );
}

function SoundOnIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  );
}

function SoundOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      />
    </svg>
  );
}

export default SoundControl;
