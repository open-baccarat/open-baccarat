// ============================================
// OpenBaccarat - 游戏状态管理
// ============================================

import { create } from 'zustand';
import type { GameState, Shoe, Round, Card, GameStats, RoadmapPoint, HistoryViewType, RoadmapViewType } from '@/types';

interface GameStore extends GameState {
  // 游戏统计
  stats: GameStats | null;
  
  // 历史记录
  history: Round[];
  historyPage: number;
  historyTotalPages: number;
  
  // 路单数据
  roadmapData: RoadmapPoint[];
  
  // UI 状态
  historyViewType: HistoryViewType;
  roadmapViewType: RoadmapViewType;
  currentLocalTime: Date;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentShoe: (shoe: Shoe | null) => void;
  setCurrentRound: (round: Round | null) => void;
  setPhase: (phase: GameState['phase']) => void;
  setPlayerCards: (cards: Card[]) => void;
  setBankerCards: (cards: Card[]) => void;
  addPlayerCard: (card: Card) => void;
  addBankerCard: (card: Card) => void;
  setIsAnimating: (isAnimating: boolean) => void;
  setStats: (stats: GameStats | null) => void;
  setHistory: (history: Round[], page: number, totalPages: number) => void;
  addToHistory: (round: Round) => void;
  appendToHistory: (rounds: Round[], page: number, totalPages: number) => void;
  updateHistoryItem: (id: string, updates: Partial<Round>) => void;
  setRoadmapData: (data: RoadmapPoint[]) => void;
  setHistoryViewType: (type: HistoryViewType) => void;
  setRoadmapViewType: (type: RoadmapViewType) => void;
  updateLocalTime: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: Omit<GameStore, 
  | 'setCurrentShoe' 
  | 'setCurrentRound' 
  | 'setPhase' 
  | 'setPlayerCards' 
  | 'setBankerCards'
  | 'addPlayerCard'
  | 'addBankerCard'
  | 'setIsAnimating'
  | 'setStats'
  | 'setHistory'
  | 'addToHistory'
  | 'appendToHistory'
  | 'updateHistoryItem'
  | 'setRoadmapData'
  | 'setHistoryViewType'
  | 'setRoadmapViewType'
  | 'updateLocalTime'
  | 'setLoading'
  | 'setError'
  | 'reset'
> = {
  currentShoe: null,
  currentRound: null,
  phase: 'idle',
  playerCards: [],
  bankerCards: [],
  isAnimating: false,
  stats: null,
  history: [],
  historyPage: 1,
  historyTotalPages: 1,
  roadmapData: [],
  historyViewType: 'list',
  roadmapViewType: 'bead_plate',
  currentLocalTime: new Date(),
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  
  setCurrentShoe: (shoe) => set({ currentShoe: shoe }),
  
  setCurrentRound: (round) => set({ currentRound: round }),
  
  setPhase: (phase) => set({ phase }),
  
  setPlayerCards: (cards) => set({ playerCards: cards }),
  
  setBankerCards: (cards) => set({ bankerCards: cards }),
  
  addPlayerCard: (card) => set((state) => ({ 
    playerCards: [...state.playerCards, card] 
  })),
  
  addBankerCard: (card) => set((state) => ({ 
    bankerCards: [...state.bankerCards, card] 
  })),
  
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  
  setStats: (stats) => set({ stats }),
  
  setHistory: (history, page, totalPages) => set({ 
    history, 
    historyPage: page, 
    historyTotalPages: totalPages 
  }),
  
  addToHistory: (round) => set((state) => ({ 
    history: [round, ...state.history].slice(0, 100) // 保留最近100条
  })),
  
  appendToHistory: (rounds, page, totalPages) => set((state) => ({
    history: [...state.history, ...rounds],
    historyPage: page,
    historyTotalPages: totalPages,
  })),
  
  updateHistoryItem: (id, updates) => set((state) => ({
    history: state.history.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  setRoadmapData: (data) => set({ roadmapData: data }),
  
  setHistoryViewType: (type) => set({ historyViewType: type }),
  
  setRoadmapViewType: (type) => set({ roadmapViewType: type }),
  
  updateLocalTime: () => set({ currentLocalTime: new Date() }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));
