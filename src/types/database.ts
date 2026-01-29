// ============================================
// OpenBaccarat - Supabase 数据库类型
// 与 database.sql 保持完全同步
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 卡牌花色枚举
export type CardSuitEnum = 'spade' | 'heart' | 'diamond' | 'club';

// 卡牌点数枚举
export type CardRankEnum = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// 游戏结果枚举
export type GameResultEnum = 'banker_win' | 'player_win' | 'tie';

// 发牌目标枚举
export type DealTargetEnum = 'player' | 'banker' | 'burn_start' | 'burn_end';

// 区块链状态枚举
export type BlockchainStatusEnum = 'pending' | 'confirmed' | 'failed';

// 卡牌 JSON 结构
export interface CardJson {
  suit: CardSuitEnum;
  rank: CardRankEnum;
}

export interface Database {
  public: {
    Tables: {
      shoes: {
        Row: {
          id: string
          shoe_number: number
          deck_count: number
          total_cards: number
          first_card_suit: CardSuitEnum | null
          first_card_rank: CardRankEnum | null
          burn_start_count: number
          burn_end_count: number
          usable_cards: number
          shuffle_vrf_proof: string | null
          started_at: string
          started_at_unix: number
          ended_at: string | null
          ended_at_unix: number | null
          solana_signature: string | null
          solana_slot: number | null
          solana_block_time: number | null
          solana_explorer_url: string | null
          blockchain_status: BlockchainStatusEnum
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shoe_number?: number // 数据库自动生成
          deck_count?: number
          total_cards?: number
          first_card_suit?: CardSuitEnum | null
          first_card_rank?: CardRankEnum | null
          burn_start_count?: number
          burn_end_count?: number
          usable_cards?: number
          shuffle_vrf_proof?: string | null
          started_at?: string
          started_at_unix?: number
          ended_at?: string | null
          ended_at_unix?: number | null
          solana_signature?: string | null
          solana_slot?: number | null
          solana_block_time?: number | null
          solana_explorer_url?: string | null
          blockchain_status?: BlockchainStatusEnum
        }
        Update: {
          shoe_number?: number
          deck_count?: number
          total_cards?: number
          first_card_suit?: CardSuitEnum | null
          first_card_rank?: CardRankEnum | null
          burn_start_count?: number
          burn_end_count?: number
          usable_cards?: number
          shuffle_vrf_proof?: string | null
          started_at?: string
          started_at_unix?: number
          ended_at?: string | null
          ended_at_unix?: number | null
          solana_signature?: string | null
          solana_slot?: number | null
          solana_block_time?: number | null
          solana_explorer_url?: string | null
          blockchain_status?: BlockchainStatusEnum
        }
      }
      rounds: {
        Row: {
          id: string
          shoe_id: string
          round_number: number
          player_total: number
          banker_total: number
          winning_total: number
          result: GameResultEnum
          is_player_pair: boolean
          is_banker_pair: boolean
          vrf_proof: string | null
          started_at: string
          started_at_unix: number
          completed_at: string
          completed_at_unix: number
          solana_signature: string | null
          solana_slot: number | null
          solana_block_time: number | null
          solana_explorer_url: string | null
          blockchain_status: BlockchainStatusEnum
          created_at: string
        }
        Insert: {
          id?: string
          shoe_id: string
          round_number: number
          player_total: number
          banker_total: number
          winning_total: number
          result: GameResultEnum
          is_player_pair?: boolean
          is_banker_pair?: boolean
          vrf_proof?: string | null
          started_at: string
          started_at_unix: number
          completed_at: string
          completed_at_unix: number
          solana_signature?: string | null
          solana_slot?: number | null
          solana_block_time?: number | null
          solana_explorer_url?: string | null
          blockchain_status?: BlockchainStatusEnum
        }
        Update: {
          shoe_id?: string
          round_number?: number
          player_total?: number
          banker_total?: number
          winning_total?: number
          result?: GameResultEnum
          is_player_pair?: boolean
          is_banker_pair?: boolean
          vrf_proof?: string | null
          started_at?: string
          started_at_unix?: number
          completed_at?: string
          completed_at_unix?: number
          solana_signature?: string | null
          solana_slot?: number | null
          solana_block_time?: number | null
          solana_explorer_url?: string | null
          blockchain_status?: BlockchainStatusEnum
        }
      }
      used_cards: {
        Row: {
          id: string
          shoe_id: string
          round_id: string
          deal_order: number
          target: DealTargetEnum
          suit: CardSuitEnum
          rank: CardRankEnum
          created_at: string
        }
        Insert: {
          id?: string
          shoe_id: string
          round_id: string
          deal_order: number
          target: DealTargetEnum
          suit: CardSuitEnum
          rank: CardRankEnum
        }
        Update: {
          shoe_id?: string
          round_id?: string
          deal_order?: number
          target?: DealTargetEnum
          suit?: CardSuitEnum
          rank?: CardRankEnum
        }
      }
    }
    Views: {
      game_stats: {
        Row: {
          total_rounds: number
          banker_wins: number
          player_wins: number
          ties: number
          banker_pairs: number
          player_pairs: number
        }
      }
      current_shoe: {
        Row: {
          id: string
          shoe_number: number
          deck_count: number
          total_cards: number
          first_card_suit: CardSuitEnum | null
          first_card_rank: CardRankEnum | null
          burn_start_count: number
          burn_end_count: number
          usable_cards: number
          shuffle_vrf_proof: string | null
          started_at: string
          started_at_unix: number
          ended_at: string | null
          ended_at_unix: number | null
          rounds_played: number
          cards_used: number
        }
      }
      rounds_list: {
        Row: {
          id: string
          shoe_id: string
          shoe_number: number
          round_number: number
          result: GameResultEnum
          player_total: number
          banker_total: number
          winning_total: number
          is_player_pair: boolean
          is_banker_pair: boolean
          started_at: string
          started_at_unix: number
          completed_at: string
          completed_at_unix: number
          solana_signature: string | null
          solana_explorer_url: string | null
          blockchain_status: BlockchainStatusEnum
          player_cards: CardJson[]
          banker_cards: CardJson[]
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      card_suit: CardSuitEnum
      card_rank: CardRankEnum
      game_result: GameResultEnum
      deal_target: DealTargetEnum
      blockchain_status: BlockchainStatusEnum
    }
  }
}

// ============================================
// 类型辅助工具
// ============================================

// 表行类型快捷方式
export type ShoeRow = Database['public']['Tables']['shoes']['Row'];
export type ShoeInsert = Database['public']['Tables']['shoes']['Insert'];
export type ShoeUpdate = Database['public']['Tables']['shoes']['Update'];

export type RoundRow = Database['public']['Tables']['rounds']['Row'];
export type RoundInsert = Database['public']['Tables']['rounds']['Insert'];
export type RoundUpdate = Database['public']['Tables']['rounds']['Update'];

export type UsedCardRow = Database['public']['Tables']['used_cards']['Row'];
export type UsedCardInsert = Database['public']['Tables']['used_cards']['Insert'];
export type UsedCardUpdate = Database['public']['Tables']['used_cards']['Update'];

// 视图行类型快捷方式
export type GameStatsRow = Database['public']['Views']['game_stats']['Row'];
export type CurrentShoeRow = Database['public']['Views']['current_shoe']['Row'];
export type RoundsListRow = Database['public']['Views']['rounds_list']['Row'];
