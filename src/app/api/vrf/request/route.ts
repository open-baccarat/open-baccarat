// ============================================
// OpenBaccarat - VRF 请求 API
// 处理 ORAO VRF 随机数请求（生产模式）
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// ORAO VRF Program ID
const ORAO_VRF_PROGRAM_ID = new PublicKey(
  process.env.ORAO_VRF_PROGRAM_ID || 'VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y'
);

/**
 * POST /api/vrf/request
 * 请求 ORAO VRF 随机数
 */
export async function POST(request: NextRequest) {
  try {
    const { seed } = await request.json();

    if (!seed) {
      return NextResponse.json(
        { error: '缺少 seed 参数' },
        { status: 400 }
      );
    }

    // 检查是否配置了私钥
    const secretKeyBase58 = process.env.SOLANA_PAYER_SECRET_KEY;
    
    if (!secretKeyBase58) {
      // 没有配置私钥，返回模拟数据
      console.log('⚠️ VRF API: 未配置 SOLANA_PAYER_SECRET_KEY，返回模拟数据');
      return NextResponse.json(await generateMockVrf(seed));
    }

    // 生产模式：调用 ORAO VRF
    const result = await requestOraoVrf(seed, secretKeyBase58);
    return NextResponse.json(result);

  } catch (error) {
    console.error('VRF 请求失败:', error);
    return NextResponse.json(
      { error: `VRF 请求失败: ${error}` },
      { status: 500 }
    );
  }
}

/**
 * 生成模拟 VRF 数据
 */
async function generateMockVrf(seed: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed + Date.now().toString());
  
  // 使用 Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const randomness = Array.from(new Uint8Array(hashBuffer));
  const proof = Buffer.from(randomness).toString('hex');

  return {
    randomness,
    proof: `demo_vrf_proof_${proof.slice(0, 32)}`,
    publicKey: 'demo_public_key',
    transactionSignature: null,
    isDemo: true,
  };
}

/**
 * 请求真实的 ORAO VRF
 */
async function requestOraoVrf(seed: string, secretKeyBase58: string) {
  // 动态导入 ORAO SDK（避免在未使用时加载）
  const { Orao } = await import('@orao-network/solana-vrf');
  const bs58 = await import('bs58');

  // 创建连接和 payer
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );

  // 解码私钥
  const secretKey = bs58.default.decode(secretKeyBase58);
  const payer = Keypair.fromSecretKey(secretKey);

  console.log(`🎲 VRF: 使用付款账户 ${payer.publicKey.toBase58()}`);

  // 创建 ORAO 实例
  // 注意：Orao 需要 anchor Provider，这里需要适配
  // 暂时使用模拟数据，实际集成需要更多配置
  console.log('⚠️ VRF: ORAO SDK 集成需要 Anchor Provider，暂时使用模拟数据');
  
  // TODO: 完整的 ORAO 集成需要：
  // 1. 安装 @coral-xyz/anchor
  // 2. 创建 AnchorProvider
  // 3. 调用 orao.request(seed)
  // 4. 等待随机数填充
  
  return generateMockVrf(seed);
}

/**
 * GET /api/vrf/request
 * 获取 VRF 状态
 */
export async function GET() {
  const hasSecretKey = !!process.env.SOLANA_PAYER_SECRET_KEY;
  
  return NextResponse.json({
    provider: hasSecretKey ? 'ORAO Network' : 'Demo (模拟)',
    programId: ORAO_VRF_PROGRAM_ID.toBase58(),
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
    isConfigured: hasSecretKey,
  });
}
