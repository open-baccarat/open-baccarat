// 测试 Twitter 发推 - 使用真实数据库数据发送推文
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Twitter API 调用
async function postTweet(shoeNumber: number, rounds: any[], stats: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7777';
  
  const response = await fetch(`${baseUrl}/api/twitter/tweet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'shoe_complete',
      shoeNumber,
      rounds: rounds.map(r => ({
        id: r.id,
        roundNumber: r.roundNumber,
        result: r.result,
        playerTotal: r.playerTotal,
        bankerTotal: r.bankerTotal,
        isPair: r.isPair,
        isNatural: r.isNatural,
      })),
      stats,
    }),
  });
  
  return response.json();
}

async function main() {
  const shoeNumber = parseInt(process.argv[2] || '3');
  
  console.log(`🐦 测试发送牌靴 #${shoeNumber} 推文...`);
  console.log('');
  
  try {
    // 获取牌靴信息
    const { data: shoeData, error: shoeError } = await supabase
      .from('shoes')
      .select('*')
      .eq('shoe_number', shoeNumber)
      .single();
    
    if (shoeError || !shoeData) {
      console.error('❌ 找不到牌靴:', shoeError);
      return;
    }
    
    console.log(`📊 牌靴 #${shoeNumber} ID: ${shoeData.id}`);
    
    // 获取该牌靴的所有回合
    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds_list')
      .select('*')
      .eq('shoe_id', shoeData.id)
      .order('round_number', { ascending: true });
    
    if (roundsError) {
      console.error('❌ 获取回合失败:', roundsError);
      return;
    }
    
    console.log(`📊 共 ${roundsData?.length || 0} 局记录`);
    
    if (!roundsData || roundsData.length === 0) {
      console.error('❌ 没有找到任何回合记录');
      return;
    }
    
    // 转换数据格式
    const rounds = roundsData.map((row: any) => ({
      id: row.id,
      shoeId: row.shoe_id,
      shoeNumber: row.shoe_number,
      roundNumber: row.round_number,
      playerCards: row.player_cards || [],
      bankerCards: row.banker_cards || [],
      playerTotal: row.player_total,
      bankerTotal: row.banker_total,
      winningTotal: row.winning_total,
      result: row.result as 'banker_win' | 'player_win' | 'tie',
      isPair: {
        player: row.is_player_pair,
        banker: row.is_banker_pair,
      },
      isNatural: row.player_total >= 8 || row.banker_total >= 8,
      startedAt: new Date(row.started_at),
      startedAtUnix: row.started_at_unix,
      completedAt: new Date(row.completed_at),
      completedAtUnix: row.completed_at_unix,
      solanaSignature: row.solana_signature,
      solanaExplorerUrl: row.solana_explorer_url,
      blockchainStatus: row.blockchain_status,
    }));
    
    // 计算统计
    const stats = {
      bankerWins: rounds.filter(r => r.result === 'banker_win').length,
      playerWins: rounds.filter(r => r.result === 'player_win').length,
      ties: rounds.filter(r => r.result === 'tie').length,
      naturals: rounds.filter(r => r.isNatural).length,
      bankerPairs: rounds.filter(r => r.isPair.banker).length,
      playerPairs: rounds.filter(r => r.isPair.player).length,
    };
    
    console.log(`📊 统计: 庄赢${stats.bankerWins} 闲赢${stats.playerWins} 和${stats.ties}`);
    console.log(`📊 天牌${stats.naturals} 庄对${stats.bankerPairs} 闲对${stats.playerPairs}`);
    console.log('');
    console.log('📤 正在发送推文...');
    console.log('');
    
    // 发送推文
    const result = await postTweet(shoeNumber, rounds, stats);
    
    console.log('📋 API 响应:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('');
      console.log('✅ 推文发送成功!');
      console.log(`   🔗 ${result.tweetUrl}`);
      console.log(`   🖼️ 图片: ${result.hasImage ? '已附带' : '无'}`);
      if (result.verified !== undefined) {
        console.log(`   📋 验证: ${result.verified ? '✓ 通过' : '✗ 未通过'}`);
      }
    } else {
      console.log('');
      console.log('❌ 推文发送失败:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main();
