// ============================================
// OpenBaccarat - Twitter 自动发推 API
// 支持发送带图片的推文
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateRoundImage, generateRoadmapImage } from '@/lib/twitter/imageGenerator';

// Vercel 函数配置：增加超时时间（Pro plan: 60s, Hobby: 10s）
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Twitter API 配置
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET || '';
const TWITTER_ENABLED = process.env.NEXT_PUBLIC_TWITTER_ENABLED === 'true';

// 卡牌类型
interface Card {
  suit: string;
  rank: string;
}

// 推文数据类型
interface RoundResultData {
  type: 'round_result';
  roundNumber: number;
  shoeNumber: number;
  result: 'banker_win' | 'player_win' | 'tie';
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  isNatural: boolean;
  isPair: { player: boolean; banker: boolean };
  completedAt: string;
  solanaSignature?: string;
  explorerUrl?: string;
}

interface ShoeCompleteData {
  type: 'shoe_complete';
  shoeNumber: number;
  rounds: Array<{
    id: string;
    roundNumber: number;
    result: 'banker_win' | 'player_win' | 'tie';
    playerTotal: number;
    bankerTotal: number;
    isPair: { player: boolean; banker: boolean };
    isNatural: boolean;
  }>;
  stats: {
    bankerWins: number;
    playerWins: number;
    ties: number;
    naturals: number;
    bankerPairs: number;
    playerPairs: number;
  };
}

type TweetData = RoundResultData | ShoeCompleteData;

// 验证推文数据
function validateTweetData(data: unknown): { valid: boolean; error?: string; data?: TweetData } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const obj = data as Record<string, unknown>;
  
  if (obj.type === 'round_result') {
    if (typeof obj.roundNumber !== 'number' || obj.roundNumber < 1) {
      return { valid: false, error: 'Invalid roundNumber' };
    }
    if (!['banker_win', 'player_win', 'tie'].includes(obj.result as string)) {
      return { valid: false, error: 'Invalid result' };
    }
    if (typeof obj.playerTotal !== 'number' || obj.playerTotal < 0 || obj.playerTotal > 9) {
      return { valid: false, error: 'Invalid playerTotal' };
    }
    if (typeof obj.bankerTotal !== 'number' || obj.bankerTotal < 0 || obj.bankerTotal > 9) {
      return { valid: false, error: 'Invalid bankerTotal' };
    }
    if (!Array.isArray(obj.playerCards) || !Array.isArray(obj.bankerCards)) {
      return { valid: false, error: 'Invalid cards' };
    }
    
    return { valid: true, data: obj as unknown as RoundResultData };
  } else if (obj.type === 'shoe_complete') {
    if (typeof obj.shoeNumber !== 'number' || obj.shoeNumber < 1) {
      return { valid: false, error: 'Invalid shoeNumber' };
    }
    if (!Array.isArray(obj.rounds)) {
      return { valid: false, error: 'Invalid rounds array' };
    }
    if (!obj.stats || typeof obj.stats !== 'object') {
      return { valid: false, error: 'Invalid stats object' };
    }
    
    return { valid: true, data: obj as unknown as ShoeCompleteData };
  }
  
  return { valid: false, error: 'Invalid type' };
}

// 生成推文内容（全英文版本，带 emoji）
function generateTweetContent(data: TweetData): string {
  // 固定使用线上 URL
  const appUrl = 'https://open-baccarat.com';
  
  if (data.type === 'round_result') {
    const resultEmoji = data.result === 'banker_win' ? '🔴' : data.result === 'player_win' ? '🔵' : '🟢';
    const resultText = data.result === 'banker_win' ? 'Banker Win' : data.result === 'player_win' ? 'Player Win' : 'Tie';
    
    let tweet = `${resultEmoji} Round #${data.roundNumber}: ${resultText}\n\n`;
    tweet += `🃏 Player: ${data.playerTotal} points\n`;
    tweet += `🃏 Banker: ${data.bankerTotal} points\n`;
    
    // Special cases
    const specials: string[] = [];
    if (data.isNatural) specials.push('🌟 Natural');
    if (data.isPair.player) specials.push('💎 Player Pair');
    if (data.isPair.banker) specials.push('💎 Banker Pair');
    
    if (specials.length > 0) {
      tweet += `\n${specials.join(' | ')}\n`;
    }
    
    // On-chain verification
    if (data.explorerUrl) {
      tweet += `\n🔗 Verify: ${appUrl}/round/${data.roundNumber}`;
    }
    
    tweet += `\n\n#OpenBaccarat #Solana #Baccarat`;
    
    return tweet;
  } else {
    // Shoe complete
    const totalRounds = data.rounds.length;
    const stats = data.stats;
    const bankerRate = totalRounds > 0 
      ? ((stats.bankerWins / totalRounds) * 100).toFixed(1)
      : '0';
    const playerRate = totalRounds > 0 
      ? ((stats.playerWins / totalRounds) * 100).toFixed(1)
      : '0';
    
    let tweet = `🎴 Shoe #${data.shoeNumber} Complete! ✨\n\n`;
    tweet += `📊 Total Rounds: ${totalRounds}\n`;
    tweet += `🔴 Banker Wins: ${stats.bankerWins} (${bankerRate}%)\n`;
    tweet += `🔵 Player Wins: ${stats.playerWins} (${playerRate}%)\n`;
    tweet += `🟢 Ties: ${stats.ties}\n`;
    
    if (stats.naturals > 0) {
      tweet += `⭐ Naturals: ${stats.naturals}\n`;
    }
    if (stats.bankerPairs > 0 || stats.playerPairs > 0) {
      tweet += `💎 Pairs: Banker ${stats.bankerPairs} / Player ${stats.playerPairs}\n`;
    }
    
    tweet += `\n🔗 ${appUrl}/history\n`;
    tweet += `\n#OpenBaccarat #Solana #Baccarat 🎰`;
    
    return tweet;
  }
}

// OAuth 1.0a 签名生成
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? '')}`)
    .join('&');
  
  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');
  
  return signature;
}

// 生成 OAuth Authorization Header
function generateAuthHeader(method: string, url: string, extraParams: Record<string, string> = {}): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
    ...extraParams,
  };
  
  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN_SECRET
  );
  
  oauthParams.oauth_signature = signature;
  
  // 只在 header 中包含 oauth_ 开头的参数
  const headerParams = Object.keys(oauthParams)
    .filter(key => key.startsWith('oauth_'))
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key] ?? '')}"`)
    .join(', ');
  
  return 'OAuth ' + headerParams;
}

// 上传图片到 Twitter（使用 v1.1 API，带重试）
async function uploadMedia(imageBuffer: Buffer): Promise<string | null> {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const base64Image = imageBuffer.toString('base64');
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📤 上传图片 (尝试 ${attempt}/${RETRY_CONFIG.maxRetries})...`);
      
      // 构建 form data 参数
      const formParams = {
        media_data: base64Image,
      };
      
      const oauthParams: Record<string, string> = {
        oauth_consumer_key: TWITTER_API_KEY,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: TWITTER_ACCESS_TOKEN,
        oauth_version: '1.0',
      };
      
      // 签名需要包含 form 参数
      const allParams = { ...oauthParams, ...formParams };
      const signature = generateOAuthSignature(
        'POST',
        url,
        allParams,
        TWITTER_API_SECRET,
        TWITTER_ACCESS_TOKEN_SECRET
      );
      
      oauthParams.oauth_signature = signature;
      
      const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .sort()
        .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key] ?? '')}"`)
        .join(', ');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `media_data=${encodeURIComponent(base64Image)}`,
      });
      
      const result = await response.json();
      
      if (response.ok && result.media_id_string) {
        console.log(`✅ 图片上传成功: ${result.media_id_string}`);
        return result.media_id_string;
      } else {
        console.error(`❌ 图片上传失败 (尝试 ${attempt}):`, result);
        
        // 速率限制处理
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
          console.log(`⏳ 图片上传速率限制，等待 ${retryAfter} 秒...`);
          await delay(retryAfter * 1000);
        } else if (attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = Math.min(
            RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1),
            RETRY_CONFIG.maxDelayMs
          );
          console.log(`⏳ 等待 ${delayMs}ms 后重试上传...`);
          await delay(delayMs);
        }
      }
    } catch (error) {
      console.error(`❌ 图片上传网络错误 (尝试 ${attempt}):`, error);
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delayMs = Math.min(
          RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelayMs
        );
        console.log(`⏳ 等待 ${delayMs}ms 后重试上传...`);
        await delay(delayMs);
      }
    }
  }
  
  console.error(`❌ 图片上传最终失败 (已重试 ${RETRY_CONFIG.maxRetries} 次)`);
  return null;
}

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 带重试的发送推文（支持图片）
async function postTweetWithRetry(
  text: string, 
  mediaId?: string,
  shoeNumber?: number
): Promise<{ success: boolean; tweetId?: string; error?: string; verified?: boolean }> {
  const url = 'https://api.twitter.com/2/tweets';
  
  let lastError = '';
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📤 发送推文 (尝试 ${attempt}/${RETRY_CONFIG.maxRetries})...`);
      
      const authHeader = generateAuthHeader('POST', url);
      
      // 构建请求体
      const body: Record<string, unknown> = { text };
      if (mediaId) {
        body.media = { media_ids: [mediaId] };
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      
      if (response.ok && result.data?.id) {
        const tweetId = result.data.id;
        console.log(`✅ 推文发送成功: ${tweetId}`);
        
        // 验证推文是否正确发送
        let verified = false;
        if (shoeNumber) {
          verified = await verifyTweetPosted(tweetId, shoeNumber);
        }
        
        return { success: true, tweetId, verified };
      } else {
        lastError = result.detail || result.title || 'Failed to post tweet';
        console.error(`❌ Twitter API error (尝试 ${attempt}):`, result);
        
        // 如果是速率限制错误，等待更长时间
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
          console.log(`⏳ 速率限制，等待 ${retryAfter} 秒...`);
          await delay(retryAfter * 1000);
        } else if (attempt < RETRY_CONFIG.maxRetries) {
          // 指数退避
          const delayMs = Math.min(
            RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1),
            RETRY_CONFIG.maxDelayMs
          );
          console.log(`⏳ 等待 ${delayMs}ms 后重试...`);
          await delay(delayMs);
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request failed';
      console.error(`❌ 网络错误 (尝试 ${attempt}):`, error);
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delayMs = Math.min(
          RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelayMs
        );
        console.log(`⏳ 等待 ${delayMs}ms 后重试...`);
        await delay(delayMs);
      }
    }
  }
  
  return { success: false, error: `Failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError}` };
}

// 验证推文是否成功发送（检查推文内容是否包含正确的 shoe number）
async function verifyTweetPosted(tweetId: string, shoeNumber: number): Promise<boolean> {
  try {
    const url = `https://api.twitter.com/2/tweets/${tweetId}`;
    const authHeader = generateAuthHeader('GET', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });
    
    if (!response.ok) {
      console.warn('⚠️ 无法验证推文:', response.status);
      return false;
    }
    
    const result = await response.json();
    const tweetText = result.data?.text || '';
    
    // 检查推文内容是否包含正确的 shoe number
    const expectedPattern = new RegExp(`Shoe #${shoeNumber}`, 'i');
    const isValid = expectedPattern.test(tweetText);
    
    if (isValid) {
      console.log(`✅ 推文验证成功: Shoe #${shoeNumber}`);
    } else {
      console.warn(`⚠️ 推文验证失败: 期望 Shoe #${shoeNumber}, 实际内容: ${tweetText.slice(0, 50)}...`);
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ 验证推文失败:', error);
    return false;
  }
}

// 发送推文（兼容旧接口）
async function postTweet(text: string, mediaId?: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  return postTweetWithRetry(text, mediaId);
}

// POST /api/twitter/tweet
export async function POST(request: NextRequest) {
  // 检查是否启用
  if (!TWITTER_ENABLED) {
    return NextResponse.json(
      { success: false, error: 'Twitter integration is disabled' },
      { status: 400 }
    );
  }
  
  // 检查配置
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Twitter API credentials not configured' },
      { status: 500 }
    );
  }
  
  try {
    const rawData = await request.json();
    
    // 验证数据
    const validation = validateTweetData(rawData);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid data' },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // 生成图片
    let imageBuffer: Buffer | null = null;
    try {
      if (data.type === 'round_result') {
        imageBuffer = await generateRoundImage({
          roundNumber: data.roundNumber,
          shoeNumber: data.shoeNumber,
          result: data.result,
          playerCards: data.playerCards,
          bankerCards: data.bankerCards,
          playerTotal: data.playerTotal,
          bankerTotal: data.bankerTotal,
          isNatural: data.isNatural,
          isPair: data.isPair,
          completedAt: data.completedAt,
          explorerUrl: data.explorerUrl,
        });
      } else {
        // 转换 rounds 数据格式以适配图片生成器
        const roundsForImage = data.rounds.map(r => ({
          id: r.id,
          shoeId: '',
          shoeNumber: data.shoeNumber,
          roundNumber: r.roundNumber,
          playerCards: [],
          bankerCards: [],
          playerTotal: r.playerTotal,
          bankerTotal: r.bankerTotal,
          winningTotal: Math.max(r.playerTotal, r.bankerTotal),
          result: r.result,
          isPair: r.isPair,
          isNatural: r.isNatural,
          startedAt: new Date(),
          startedAtUnix: 0,
          completedAt: new Date(),
          completedAtUnix: 0,
          solanaSignature: null,
          solanaExplorerUrl: null,
          blockchainStatus: 'confirmed' as const,
        }));
        
        imageBuffer = await generateRoadmapImage({
          shoeNumber: data.shoeNumber,
          rounds: roundsForImage,
          stats: data.stats,
        });
      }
      console.log('✅ 图片生成成功');
    } catch (imgError) {
      console.error('❌ 图片生成失败:', imgError);
      // 继续发送无图片的推文
    }
    
    // 上传图片
    let mediaId: string | undefined;
    if (imageBuffer) {
      const uploadedMediaId = await uploadMedia(imageBuffer);
      if (uploadedMediaId) {
        mediaId = uploadedMediaId;
      }
    }
    
    // 生成推文内容
    const tweetContent = generateTweetContent(data);
    
    // 获取 shoe number 用于验证
    const shoeNumber = data.type === 'shoe_complete' ? data.shoeNumber : undefined;
    
    // 发送推文（带重试和验证）
    const result = await postTweetWithRetry(tweetContent.slice(0, 280), mediaId, shoeNumber);
    
    if (result.success) {
      console.log(`✅ 推文已发送: https://twitter.com/i/status/${result.tweetId}`);
      if (result.verified !== undefined) {
        console.log(`📋 推文验证: ${result.verified ? '通过' : '未通过'}`);
      }
      return NextResponse.json({
        success: true,
        tweetId: result.tweetId,
        tweetUrl: `https://twitter.com/i/status/${result.tweetId}`,
        hasImage: !!mediaId,
        verified: result.verified,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Tweet API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
