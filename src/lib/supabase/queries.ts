// ============================================
// OpenBaccarat - 数据库查询函数
// ============================================

import { supabase } from './client';
import type { Round, Shoe, GameStats, RoadmapPoint, PaginatedResponse, CardSuit, CardRank, Card } from '@/types';
import { calculateHandTotal } from '@/lib/game/rules';

// 视图类型定义（因为 Database 类型还未完善）
interface CurrentShoeRow {
  id: string;
  shoe_number: number;
  deck_count: number;
  total_cards: number;
  first_card_suit: CardSuit | null;
  first_card_rank: string | null;
  burn_start_count: number;
  burn_end_count: number;
  usable_cards: number;
  started_at: string;
  started_at_unix: number;
  rounds_played: number;
  cards_used: number;
}

interface GameStatsRow {
  total_rounds: number;
  banker_wins: number;
  player_wins: number;
  ties: number;
  banker_pairs: number;
  player_pairs: number;
}

// 获取当前牌靴信息
export async function getCurrentShoe(): Promise<Shoe | null> {
  const { data, error } = await supabase
    .from('current_shoe')
    .select('*')
    .single();

  if (error || !data) {
    console.error('获取当前牌靴失败:', error);
    return null;
  }

  const shoeData = data as unknown as CurrentShoeRow;

  return {
    id: shoeData.id,
    shoeNumber: shoeData.shoe_number,
    deckCount: shoeData.deck_count,
    totalCards: shoeData.total_cards,
    firstCard: shoeData.first_card_suit && shoeData.first_card_rank ? {
      suit: shoeData.first_card_suit,
      rank: shoeData.first_card_rank as CardRank,
    } : null,
    burnStartCount: shoeData.burn_start_count,
    burnEndCount: shoeData.burn_end_count,
    usableCards: shoeData.usable_cards,
    cardsUsed: shoeData.cards_used,  // 动态统计的已用牌数
    roundsPlayed: shoeData.rounds_played,
    shuffleVrfProof: null,
    startedAt: new Date(shoeData.started_at),
    startedAtUnix: shoeData.started_at_unix,
    endedAt: null,
    endedAtUnix: null,
    solanaSignature: null,
    solanaExplorerUrl: null,
    blockchainStatus: 'confirmed',
    isActive: true,
  };
}

// 获取游戏统计
export async function getGameStats(): Promise<GameStats | null> {
  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .single();

  if (error || !data) {
    console.error('获取游戏统计失败:', error);
    return null;
  }

  const statsData = data as unknown as GameStatsRow;

  return {
    totalRounds: statsData.total_rounds,
    bankerWins: statsData.banker_wins,
    playerWins: statsData.player_wins,
    ties: statsData.ties,
    bankerPairs: statsData.banker_pairs,
    playerPairs: statsData.player_pairs,
  };
}

// 视图行类型
interface RoundsListRow {
  id: string;
  shoe_id: string;
  shoe_number: number;
  round_number: number;
  result: string;
  player_total: number;
  banker_total: number;
  winning_total: number;
  is_player_pair: boolean;
  is_banker_pair: boolean;
  started_at: string;
  started_at_unix: number;
  completed_at: string;
  completed_at_unix: number;
  solana_signature: string | null;
  solana_explorer_url: string | null;
  blockchain_status: string;
  player_cards: { suit: string; rank: string }[];
  banker_cards: { suit: string; rank: string }[];
}

// 获取历史记录（分页）
export async function getRoundsHistory(
  page: number = 1,
  pageSize: number = 20,
  shoeId?: string
): Promise<PaginatedResponse<Round>> {
  const offset = (page - 1) * pageSize;

  // 获取总数（需要根据 shoeId 筛选）
  let countQuery = supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true });
  
  if (shoeId) {
    countQuery = countQuery.eq('shoe_id', shoeId);
  }
  
  const { count } = await countQuery;

  // 获取数据
  let dataQuery = supabase
    .from('rounds_list')
    .select('*')
    .order('completed_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  if (shoeId) {
    dataQuery = dataQuery.eq('shoe_id', shoeId);
  }
  
  const { data, error } = await dataQuery;

  if (error || !data) {
    console.error('获取历史记录失败:', error);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const rowsData = data as unknown as RoundsListRow[];
  const rounds: Round[] = rowsData.map(mapRowToRound);

  return {
    items: rounds,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// 路单行类型
interface RoadmapRow {
  id: string;
  round_number: number;
  result: string;
  is_player_pair: boolean;
  is_banker_pair: boolean;
}

// 获取路单数据（获取所有数据，不分页）
export async function getRoadmapData(shoeId?: string): Promise<RoadmapPoint[]> {
  let query = supabase
    .from('rounds')
    .select('id, round_number, result, is_player_pair, is_banker_pair')
    .order('round_number', { ascending: true })
    .limit(10000); // 确保获取所有数据，Supabase默认限制可能是1000

  if (shoeId) {
    query = query.eq('shoe_id', shoeId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('获取路单数据失败:', error);
    return [];
  }

  const rowsData = data as unknown as RoadmapRow[];
  return rowsData.map((row) => ({
    result: row.result as RoadmapPoint['result'],
    roundId: row.id,
    roundNumber: row.round_number,
    isPair: {
      player: row.is_player_pair,
      banker: row.is_banker_pair,
    },
  }));
}

// 牌靴行类型
interface ShoeRow {
  id: string;
  shoe_number: number;
  deck_count: number;
  total_cards: number;
  first_card_suit: CardSuit | null;
  first_card_rank: string | null;
  burn_start_count: number;
  burn_end_count: number;
  usable_cards: number;
  rounds_played: number;
  shuffle_vrf_proof: string | null;
  started_at: string;
  started_at_unix: number;
  ended_at: string | null;
  ended_at_unix: number | null;
  solana_signature: string | null;
  solana_explorer_url: string | null;
  blockchain_status: string;
}

// 获取牌靴列表
export async function getShoesList(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Shoe>> {
  const offset = (page - 1) * pageSize;

  const { count } = await supabase
    .from('shoes')
    .select('*', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('shoes')
    .select('*')
    .order('started_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error || !data) {
    console.error('获取牌靴列表失败:', error);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const rowsData = data as unknown as ShoeRow[];
  const shoes: Shoe[] = rowsData.map((row) => ({
    id: row.id,
    shoeNumber: row.shoe_number,
    deckCount: row.deck_count,
    totalCards: row.total_cards,
    firstCard: row.first_card_suit && row.first_card_rank ? {
      suit: row.first_card_suit,
      rank: row.first_card_rank as CardRank,
    } : null,
    burnStartCount: row.burn_start_count,
    burnEndCount: row.burn_end_count,
    usableCards: row.usable_cards,
    cardsUsed: 0,  // 历史牌靴列表不需要动态统计，设为0
    roundsPlayed: row.rounds_played,
    shuffleVrfProof: row.shuffle_vrf_proof,
    startedAt: new Date(row.started_at),
    startedAtUnix: row.started_at_unix,
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    endedAtUnix: row.ended_at_unix,
    solanaSignature: row.solana_signature,
    solanaExplorerUrl: row.solana_explorer_url,
    blockchainStatus: row.blockchain_status as Shoe['blockchainStatus'],
    isActive: !row.ended_at,
  }));

  return {
    items: shoes,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// 订阅实时更新
export function subscribeToRounds(callback: (round: Round) => void) {
  return supabase
    .channel('rounds_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'rounds' },
      (payload) => {
        // 触发回调刷新数据
        callback(payload.new as unknown as Round);
      }
    )
    .subscribe();
}

// ============================================
// 写入操作
// ============================================

// 创建新牌靴（使用原子性函数，确保编号不跳过，并自动关闭旧牌靴）
export async function createShoe(shoe: Shoe): Promise<{ id: string; shoeNumber: number } | null> {
  // 使用 create_next_shoe 函数：
  // 1. 自动关闭所有活动牌靴
  // 2. 原子性分配牌靴编号（MAX+1）
  // 3. 创建新牌靴
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_next_shoe', {
    p_id: shoe.id,
    p_deck_count: shoe.deckCount,
    p_total_cards: shoe.totalCards,
    p_first_card_suit: shoe.firstCard?.suit || null,
    p_first_card_rank: shoe.firstCard?.rank || null,
    p_burn_start_count: shoe.burnStartCount,
    p_burn_end_count: shoe.burnEndCount,
    p_shuffle_vrf_proof: shoe.shuffleVrfProof,
    p_solana_signature: shoe.solanaSignature,
    p_blockchain_status: shoe.blockchainStatus,
  });

  if (error) {
    console.error('创建牌靴失败:', error);
    return null;
  }

  // RPC 返回的是数组，取第一个元素
  const result = Array.isArray(data) ? data[0] : data;
  return result ? { id: result.id, shoeNumber: result.shoe_number } : null;
}

// 更新牌靴
export async function updateShoe(shoeId: string, updates: Partial<{
  usable_cards: number;
  rounds_played: number;
  ended_at: string;
  ended_at_unix: number;
}>): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('shoes')
    .update(updates)
    .eq('id', shoeId);

  if (error) {
    console.error('更新牌靴失败:', error);
    return false;
  }

  return true;
}

// 创建新回合（使用原子性函数，确保局号不跳过）
// 返回 { id, roundNumber } 以便调用者知道实际分配的局号
export async function createRound(round: Round): Promise<{ id: string; roundNumber: number } | null> {
  // 使用原子性数据库函数，确保局号连续不跳过
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_round_atomic', {
    p_id: round.id,
    p_shoe_id: round.shoeId,
    p_result: round.result,
    p_player_total: round.playerTotal,
    p_banker_total: round.bankerTotal,
    p_winning_total: round.winningTotal,
    p_is_player_pair: round.isPair.player,
    p_is_banker_pair: round.isPair.banker,
    p_started_at: round.startedAt.toISOString(),
    p_started_at_unix: round.startedAtUnix,
    p_completed_at: round.completedAt.toISOString(),
    p_completed_at_unix: round.completedAtUnix,
    p_solana_signature: round.solanaSignature,
    p_blockchain_status: round.blockchainStatus,
  });

  if (error) {
    console.error('创建回合失败:', error);
    return null;
  }

  // RPC 返回的是数组，取第一个元素
  const result = Array.isArray(data) ? data[0] : data;
  
  if (!result) {
    console.error('创建回合返回空结果');
    return null;
  }

  // 记录使用的牌
  await recordUsedCards(result.id, round.shoeId, round.playerCards, round.bankerCards);

  return { id: result.id, roundNumber: result.round_number };
}

// 记录使用的牌
async function recordUsedCards(
  roundId: string,
  shoeId: string,
  playerCards: { suit: CardSuit; rank: CardRank }[],
  bankerCards: { suit: CardSuit; rank: CardRank }[]
): Promise<void> {
  const cards = [
    ...playerCards.map((c, i) => ({
      round_id: roundId,
      shoe_id: shoeId,
      position: i + 1,
      dealt_to: 'player' as const,
      suit: c.suit,
      rank: c.rank,
    })),
    ...bankerCards.map((c, i) => ({
      round_id: roundId,
      shoe_id: shoeId,
      position: playerCards.length + i + 1,
      dealt_to: 'banker' as const,
      suit: c.suit,
      rank: c.rank,
    })),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('used_cards').insert(cards);

  if (error) {
    console.error('记录使用的牌失败:', error);
  }
}

// 获取指定牌靴中所有已使用的牌
export async function getUsedCardsByShoe(shoeId: string): Promise<Array<{ rank: CardRank; suit: CardSuit }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('used_cards')
    .select('rank, suit')
    .eq('shoe_id', shoeId);

  if (error) {
    console.error('获取已使用的牌失败:', error);
    return [];
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((card: { rank: string; suit: string }) => ({
    rank: card.rank as CardRank,
    suit: card.suit as CardSuit,
  }));
}

// 更新回合的链上信息
export async function updateRound(
  roundId: string,
  updates: {
    solana_signature?: string | null;
    solana_explorer_url?: string | null;
    blockchain_status?: string;
  }
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('rounds')
    .update(updates)
    .eq('id', roundId);

  if (error) {
    console.error('更新回合失败:', error);
    return false;
  }

  console.log(`✅ 回合链上信息已更新: ${roundId}`);
  return true;
}

// 根据局号获取单局详情
// 辅助函数：将数据库行转换为 Round 对象
function mapRowToRound(row: RoundsListRow): Round {
  const playerCards: Card[] = row.player_cards.map((c) => ({
    suit: c.suit as CardSuit,
    rank: c.rank as CardRank,
  }));
  const bankerCards: Card[] = row.banker_cards.map((c) => ({
    suit: c.suit as CardSuit,
    rank: c.rank as CardRank,
  }));
  
  // 计算是否为天牌（前两张牌达到8或9点）
  const playerFirst2 = playerCards.slice(0, 2);
  const bankerFirst2 = bankerCards.slice(0, 2);
  const playerFirst2Total = playerFirst2.length >= 2 ? calculateHandTotal(playerFirst2) : 0;
  const bankerFirst2Total = bankerFirst2.length >= 2 ? calculateHandTotal(bankerFirst2) : 0;
  const isNatural = playerFirst2Total >= 8 || bankerFirst2Total >= 8;
  
  return {
    id: row.id,
    shoeId: row.shoe_id,
    shoeNumber: row.shoe_number,
    roundNumber: row.round_number,
    playerCards,
    bankerCards,
    playerTotal: row.player_total,
    bankerTotal: row.banker_total,
    winningTotal: row.winning_total,
    result: row.result as Round['result'],
    isPair: {
      player: row.is_player_pair,
      banker: row.is_banker_pair,
    },
    isNatural,
    startedAt: new Date(row.started_at),
    startedAtUnix: row.started_at_unix,
    completedAt: new Date(row.completed_at),
    completedAtUnix: row.completed_at_unix,
    solanaSignature: row.solana_signature,
    solanaExplorerUrl: row.solana_explorer_url,
    blockchainStatus: row.blockchain_status as Round['blockchainStatus'],
  };
}

export async function getRoundByNumber(roundNumber: number): Promise<Round | null> {
  const { data, error } = await supabase
    .from('rounds_list')
    .select('*')
    .eq('round_number', roundNumber)
    .single();

  if (error || !data) {
    console.error('获取单局详情失败:', error);
    return null;
  }

  const row = data as unknown as RoundsListRow;
  return mapRowToRound(row);
}

// 根据 ID 获取单局详情
export async function getRoundById(roundId: string): Promise<Round | null> {
  const { data, error } = await supabase
    .from('rounds_list')
    .select('*')
    .eq('id', roundId)
    .single();

  if (error || !data) {
    console.error('获取单局详情失败:', error);
    return null;
  }

  const row = data as unknown as RoundsListRow;
  return mapRowToRound(row);
}

// ==================== 局号完整性检查 ====================

// 从数据库获取下一个局号（原子操作，使用序列保证唯一）
export async function getNextRoundNumber(): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_next_round_number');
  
  if (error) {
    console.error('获取下一个局号失败:', error);
    return null;
  }
  
  return data as number;
}

// 同步局号序列到当前最大值（服务启动时调用）
export async function syncRoundNumberSequence(): Promise<boolean> {
  const { error } = await supabase.rpc('sync_round_number_seq');
  
  if (error) {
    console.error('同步局号序列失败:', error);
    return false;
  }
  
  return true;
}

// 检测重复局号
export async function checkRoundDuplicates(): Promise<{ roundNumber: number; count: number }[]> {
  const { data, error } = await supabase.rpc('check_round_duplicates') as { 
    data: { round_number: number; count: number }[] | null; 
    error: Error | null 
  };
  
  if (error) {
    console.error('检测重复局号失败:', error);
    return [];
  }
  
  return (data || []).map((row) => ({
    roundNumber: row.round_number,
    count: row.count,
  }));
}

// 检测跳号
export async function checkRoundGaps(): Promise<number[]> {
  const { data, error } = await supabase.rpc('check_round_gaps') as {
    data: { missing_round: number }[] | null;
    error: Error | null
  };
  
  if (error) {
    console.error('检测跳号失败:', error);
    return [];
  }
  
  return (data || []).map((row) => row.missing_round);
}

// 获取当前最大局号
export async function getMaxRoundNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('rounds')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1)
    .single<{ round_number: number }>();
  
  if (error || !data) {
    return 0;
  }
  
  return data.round_number;
}

// ==================== 牌靴号完整性检查 ====================

// 检测重复牌靴号
export async function checkShoeDuplicates(): Promise<{ shoeNumber: number; count: number }[]> {
  const { data, error } = await supabase.rpc('check_shoe_duplicates') as { 
    data: { shoe_number: number; count: number }[] | null; 
    error: Error | null 
  };
  
  if (error) {
    console.error('检测重复牌靴号失败:', error);
    return [];
  }
  
  return (data || []).map((row) => ({
    shoeNumber: row.shoe_number,
    count: row.count,
  }));
}

// 检测牌靴跳号
export async function checkShoeGaps(): Promise<number[]> {
  const { data, error } = await supabase.rpc('check_shoe_gaps') as {
    data: { missing_shoe: number }[] | null;
    error: Error | null
  };
  
  if (error) {
    console.error('检测牌靴跳号失败:', error);
    return [];
  }
  
  return (data || []).map((row) => row.missing_shoe);
}

// 获取当前最大牌靴号
export async function getMaxShoeNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('shoes')
    .select('shoe_number')
    .order('shoe_number', { ascending: false })
    .limit(1)
    .single<{ shoe_number: number }>();
  
  if (error || !data) {
    return 0;
  }
  
  return data.shoe_number;
}
