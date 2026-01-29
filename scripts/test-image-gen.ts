// 测试图片生成 - 使用真实数据库数据
import { generateRoadmapImage } from '../src/lib/twitter/imageGenerator';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const shoeNumber = parseInt(process.argv[2] || '1');
  
  console.log(`🖼️ 生成牌靴 #${shoeNumber} 的完整路单图片...`);
  
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
    
    console.log(`📊 统计: 庄${stats.bankerWins} 闲${stats.playerWins} 和${stats.ties}`);
    console.log(`📊 天牌${stats.naturals} 庄对${stats.bankerPairs} 闲对${stats.playerPairs}`);
    
    // 生成图片
    const imageBuffer = await generateRoadmapImage({
      shoeNumber,
      rounds,
      stats,
    });
    
    const outputPath = join(process.cwd(), `shoe-${shoeNumber}-roadmap.png`);
    await writeFile(outputPath, imageBuffer);
    
    console.log(`✅ 图片已生成: ${outputPath}`);
    console.log(`📊 图片大小: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
  }
}

main();
