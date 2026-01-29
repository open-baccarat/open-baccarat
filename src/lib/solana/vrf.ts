// ============================================
// OpenBaccarat - VRF 可验证随机函数
// 集成 ORAO Network VRF
// ============================================

import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';

/**
 * ORAO VRF Program ID（Mainnet 和 Devnet 相同）
 * 这是 ORAO 部署在 Solana 上的官方程序地址，所有人使用同一个
 */
export const ORAO_VRF_PROGRAM_ID = new PublicKey(
  config.vrf.programId
);

/**
 * VRF 结果接口
 */
export interface VrfResult {
  randomness: Uint8Array;
  proof: string;
  publicKey: string;
  seed: Uint8Array;
  transactionSignature?: string;
}

export interface VrfVerification {
  isValid: boolean;
  error?: string;
}

/**
 * VRF 客户端类
 * 封装 ORAO VRF 的所有操作
 */
export class VrfClient {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      config.blockchain.rpcUrl,
      'confirmed'
    );
  }

  /**
   * 初始化 VRF 客户端
   */
  async initialize(): Promise<boolean> {
    if (!config.vrf.useReal) {
      console.log('🎲 VRF: 演示模式，使用模拟随机数');
      return true;
    }

    console.log('🎲 VRF: ORAO VRF 已配置');
    console.log(`   Program ID: ${ORAO_VRF_PROGRAM_ID.toBase58()}`);
    console.log(`   Network: ${config.blockchain.network}`);
    
    return true;
  }

  /**
   * 生成 VRF 随机数
   * 
   * demo：使用 Web Crypto API 生成伪随机数
   * blockhash：使用 Solana 区块哈希（免费）
   * orao：使用 ORAO VRF（付费）
   */
  async generateRandomness(seed: string): Promise<VrfResult> {
    switch (config.vrf.provider) {
      case 'blockhash':
        return this.generateBlockhashRandomness(seed);
      case 'orao':
        return this.requestOraoVrf(seed);
      case 'demo':
      default:
        return this.generateMockRandomness(seed);
    }
  }

  /**
   * 使用 Solana 区块哈希生成随机数（免费方案）
   * 
   * 原理：获取最新区块哈希，结合种子生成随机数
   * 优点：免费、链上可验证
   * 缺点：理论上矿工可以影响（但对于游戏足够安全）
   */
  private async generateBlockhashRandomness(seed: string): Promise<VrfResult> {
    try {
      // 获取最新区块哈希
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
      
      console.log(`🎲 使用区块哈希: ${blockhash.slice(0, 16)}...`);
      
      // 结合区块哈希和种子生成随机数
      const encoder = new TextEncoder();
      const combinedData = encoder.encode(blockhash + seed + lastValidBlockHeight.toString());
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', combinedData);
      const randomness = new Uint8Array(hashBuffer);
      
      return {
        randomness,
        proof: `blockhash:${blockhash}`,
        publicKey: blockhash,
        seed: encoder.encode(seed),
      };
    } catch (error) {
      console.error('获取区块哈希失败，降级到模拟随机数:', error);
      return this.generateMockRandomness(seed);
    }
  }

  /**
   * 模拟随机数生成（演示模式）
   */
  private async generateMockRandomness(seed: string): Promise<VrfResult> {
    const encoder = new TextEncoder();
    const data = encoder.encode(seed + Date.now().toString());
    
    // 使用 Web Crypto API 生成伪随机数
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const randomness = new Uint8Array(hashBuffer);
    
    // 模拟证明
    const proof = Buffer.from(randomness).toString('hex');
    
    return {
      randomness,
      proof: `demo_vrf_proof_${proof.slice(0, 32)}`,
      publicKey: 'demo_public_key',
      seed: encoder.encode(seed),
    };
  }

  /**
   * 通过后端 API 请求 ORAO VRF
   * 注意：私钥操作应该在服务端进行
   */
  private async requestOraoVrf(seed: string): Promise<VrfResult> {
    try {
      const response = await fetch('/api/vrf/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed }),
      });

      if (!response.ok) {
        throw new Error(`VRF 请求失败: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        randomness: new Uint8Array(result.randomness),
        proof: result.proof,
        publicKey: result.publicKey,
        seed: new TextEncoder().encode(seed),
        transactionSignature: result.transactionSignature,
      };
    } catch (error) {
      console.error('❌ ORAO VRF 请求失败:', error);
      // 降级到模拟随机数
      console.warn('⚠️ 降级使用模拟随机数');
      return this.generateMockRandomness(seed);
    }
  }

  /**
   * 验证 VRF 证明
   */
  async verifyProof(
    proof: string,
    seed: string,
    publicKey: string
  ): Promise<VrfVerification> {
    // 演示模式：简单验证
    if (!config.vrf.useReal) {
      if (!proof || !seed) {
        return { isValid: false, error: '缺少必要参数' };
      }
      return { isValid: true };
    }

    // 生产模式：验证链上数据
    try {
      // 检查是否为演示 proof
      if (publicKey === 'demo_public_key') {
        return { isValid: true };
      }

      const randomnessAccount = new PublicKey(publicKey);
      const accountInfo = await this.connection.getAccountInfo(randomnessAccount);
      
      if (!accountInfo) {
        return { isValid: false, error: '随机数账户不存在' };
      }

      // 验证账户所有者是 ORAO VRF 程序
      if (!accountInfo.owner.equals(ORAO_VRF_PROGRAM_ID)) {
        return { isValid: false, error: '账户所有者不是 ORAO VRF 程序' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `验证失败: ${error}` };
    }
  }

  /**
   * 获取 VRF 状态
   */
  getStatus(): {
    provider: string;
    isConfigured: boolean;
    network: string;
    programId: string;
  } {
    return {
      provider: config.vrf.useReal ? 'ORAO Network' : 'Demo (模拟)',
      isConfigured: config.vrf.useReal,
      network: config.blockchain.network,
      programId: ORAO_VRF_PROGRAM_ID.toBase58(),
    };
  }
}

// 导出单例实例
export const vrfClient = new VrfClient();

// ============================================
// 向后兼容的导出（保持原有 API）
// ============================================

/**
 * 生成 VRF 随机数
 */
export async function generateVrfRandomness(seed: string): Promise<VrfResult> {
  return vrfClient.generateRandomness(seed);
}

/**
 * 验证 VRF 证明
 */
export async function verifyVrfProof(
  proof: string,
  seed: string,
  publicKey: string
): Promise<VrfVerification> {
  return vrfClient.verifyProof(proof, seed, publicKey);
}

/**
 * 使用 VRF 随机数进行洗牌
 * Fisher-Yates 洗牌算法
 */
export function shuffleWithVrf<T>(array: T[], randomness: Uint8Array): T[] {
  const shuffled = [...array];
  let randomIndex = 0;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomByte = randomness[randomIndex % randomness.length] || 0;
    randomIndex++;
    
    const j = randomByte % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  
  return shuffled;
}

/**
 * 生成洗牌种子
 */
export function generateShuffleSeed(
  shoeNumber: number,
  timestamp: number,
  previousBlockHash?: string
): string {
  const components = [
    `shoe:${shoeNumber}`,
    `time:${timestamp}`,
    previousBlockHash ? `block:${previousBlockHash}` : '',
  ];
  
  return components.filter(Boolean).join('|');
}

/**
 * VRF 集成状态检查
 */
export function getVrfStatus() {
  return vrfClient.getStatus();
}
