// ============================================
// OpenBaccarat - 增强版 2D 扑克牌组件
// 支持翻牌动画、渐变效果、光泽动画
// ============================================

'use client';

import { useState, useEffect } from 'react';
import type { Card as CardType, CardSuit } from '@/types';
import { SUIT_NAMES, SUIT_COLORS } from '@/lib/game/constants';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: CardType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  faceDown?: boolean;
  animate?: boolean;
  delay?: number; // 延迟显示（用于发牌动画）
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  xs: { 
    width: 'w-6', 
    height: 'h-9', 
    text: 'text-[8px]', 
    suit: 'text-[6px]',
    centerSuit: 'text-xs',
    padding: 'p-0'
  },
  sm: { 
    width: 'w-9', 
    height: 'h-[52px]', 
    text: 'text-[11px]', 
    suit: 'text-[9px]',
    centerSuit: 'text-base',
    padding: 'p-0.5'
  },
  md: { 
    width: 'w-14', 
    height: 'h-20', 
    text: 'text-lg', 
    suit: 'text-sm',
    centerSuit: 'text-2xl',
    padding: 'p-1'
  },
  lg: { 
    width: 'w-20', 
    height: 'h-28', 
    text: 'text-2xl', 
    suit: 'text-base',
    centerSuit: 'text-4xl',
    padding: 'p-1.5'
  },
  xl: { 
    width: 'w-24', 
    height: 'h-36', 
    text: 'text-3xl', 
    suit: 'text-lg',
    centerSuit: 'text-5xl',
    padding: 'p-2'
  },
};

export function PlayingCard({ 
  card, 
  size = 'md', 
  faceDown = false, 
  animate = false,
  delay = 0,
  className,
  onClick 
}: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(faceDown);
  const [isVisible, setIsVisible] = useState(!animate);
  const [showShine, setShowShine] = useState(false);

  const config = sizeConfig[size];
  const suitSymbol = SUIT_NAMES[card.suit];
  const suitColor = SUIT_COLORS[card.suit];

  // 延迟显示动画
  useEffect(() => {
    if (animate && delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (animate) {
      setIsVisible(true);
    }
  }, [animate, delay]);

  // 翻牌动画
  useEffect(() => {
    if (isVisible && !faceDown && isFlipped) {
      const timer = setTimeout(() => {
        setIsFlipped(false);
        // 翻牌后显示光泽效果
        setTimeout(() => {
          setShowShine(true);
          setTimeout(() => setShowShine(false), 600);
        }, 300);
      }, 200);
      return () => clearTimeout(timer);
    }
    setIsFlipped(faceDown);
  }, [faceDown, isVisible, isFlipped]);

  // 牌背面
  const CardBack = () => (
    <div className="absolute inset-0 backface-hidden rotate-y-180">
      <div
        className={cn(
          'w-full h-full rounded-lg border-2',
          'bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950',
          'border-indigo-700/50',
          'flex items-center justify-center',
          'shadow-xl'
        )}
      >
        {/* 装饰图案 */}
        <div className="absolute inset-2 rounded border border-indigo-600/30 bg-gradient-to-br from-indigo-800/20 to-transparent" />
        <div className="absolute inset-3 rounded border border-indigo-500/20" />
        
        {/* 中心Logo */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-indigo-400/60 text-2xl font-bold">OB</span>
        </div>
        
        {/* 菱形图案 */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 140">
            <pattern id="diamonds" patternUnits="userSpaceOnUse" width="20" height="20">
              <path d="M10,0 L20,10 L10,20 L0,10 Z" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="140" fill="url(#diamonds)"/>
          </svg>
        </div>
      </div>
    </div>
  );

  // 牌正面
  const CardFront = () => (
    <div className="absolute inset-0 backface-hidden">
      <div
        className={cn(
          'w-full h-full rounded-lg border-2',
          'bg-gradient-to-br from-white via-gray-50 to-gray-100',
          'border-gray-200',
          'flex flex-col',
          config.padding,
          'shadow-xl relative overflow-hidden'
        )}
      >
        {/* 光泽效果 */}
        {showShine && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shine pointer-events-none" />
        )}
        
        {/* 左上角 */}
        <div className="flex flex-col items-center leading-none z-10">
          <span 
            className={cn(config.text, 'font-bold drop-shadow-sm')}
            style={{ color: suitColor }}
          >
            {card.rank}
          </span>
          <span 
            className={config.suit}
            style={{ color: suitColor }}
          >
            {suitSymbol}
          </span>
        </div>
        
        {/* 中间大花色 */}
        <div className="flex-1 flex items-center justify-center w-full z-10">
          <span 
            className={cn(config.centerSuit, 'drop-shadow-md')}
            style={{ color: suitColor }}
          >
            {suitSymbol}
          </span>
        </div>

        {/* 右下角（倒置） */}
        <div className="flex flex-col items-center leading-none rotate-180 z-10">
          <span 
            className={cn(config.text, 'font-bold drop-shadow-sm')}
            style={{ color: suitColor }}
          >
            {card.rank}
          </span>
          <span 
            className={config.suit}
            style={{ color: suitColor }}
          >
            {suitSymbol}
          </span>
        </div>

        {/* 牌面纹理 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-black/5 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        config.width,
        config.height,
        'relative cursor-pointer perspective-1000',
        // 进入动画
        animate && 'transition-all duration-500',
        animate && !isVisible && 'opacity-0 scale-75 translate-y-8',
        animate && isVisible && 'opacity-100 scale-100 translate-y-0',
        className
      )}
      onClick={onClick}
      style={{
        transitionDelay: animate ? `${delay}ms` : '0ms'
      }}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 transform-style-3d',
          isFlipped && 'rotate-y-180'
        )}
      >
        <CardFront />
        <CardBack />
      </div>
    </div>
  );
}

interface CardGroupProps {
  cards: CardType[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  overlap?: boolean;
  animate?: boolean;
  staggerDelay?: number;
  className?: string;
}

export function CardGroup({ 
  cards, 
  size = 'md', 
  overlap = true, 
  animate = false,
  staggerDelay = 150,
  className 
}: CardGroupProps) {
  return (
    <div className={cn('flex', overlap ? '-space-x-4' : 'gap-2', className)}>
      {cards.map((card, index) => (
        <PlayingCard
          key={`${card.suit}-${card.rank}-${index}`}
          card={card}
          size={size}
          animate={animate}
          delay={index * staggerDelay}
          className={cn(
            overlap ? 'first:ml-0' : '',
            // 悬浮效果
            'hover:z-10 hover:-translate-y-2 hover:shadow-2xl transition-all duration-200'
          )}
        />
      ))}
    </div>
  );
}

// 发牌动画组件
interface DealingAnimationProps {
  cards: CardType[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onComplete?: () => void;
}

export function DealingAnimation({ cards, size = 'lg', onComplete }: DealingAnimationProps) {
  const [dealtCards, setDealtCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < cards.length) {
      const card = cards[currentIndex];
      if (card) {
        const timer = setTimeout(() => {
          setDealtCards(prev => [...prev, card]);
          setCurrentIndex(prev => prev + 1);
        }, 400);
        return () => clearTimeout(timer);
      }
    } else if (currentIndex === cards.length && cards.length > 0) {
      onComplete?.();
    }
  }, [currentIndex, cards, onComplete]);

  return (
    <CardGroup 
      cards={dealtCards} 
      size={size} 
      animate={true}
      staggerDelay={0}
    />
  );
}
