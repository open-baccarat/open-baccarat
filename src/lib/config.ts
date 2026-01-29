// ============================================
// OpenBaccarat - 应用配置
// ============================================

/**
 * 应用模式
 * - demo: 演示模式，本地模拟游戏，可选择是否写入数据库
 * - production: 生产模式，使用真实 VRF 和区块链
 */
export type AppMode = 'demo' | 'production';

/**
 * 应用配置
 */
export const config = {
  // 应用模式（从环境变量读取，默认 demo）
  mode: (process.env.NEXT_PUBLIC_APP_MODE || 'demo') as AppMode,
  
  // 是否为演示模式
  get isDemo() {
    return this.mode === 'demo';
  },
  
  // 是否为生产模式
  get isProduction() {
    return this.mode === 'production';
  },
  
  // 数据库配置
  database: {
    // 是否启用数据库写入（演示模式可选，生产模式必须）
    get enableWrite() {
      const envValue = process.env.NEXT_PUBLIC_DB_WRITE_ENABLED;
      if (envValue !== undefined) {
        return envValue === 'true';
      }
      // 生产模式默认启用，演示模式默认禁用
      return config.isProduction;
    },
  },
  
  // 区块链配置
  blockchain: {
    // 是否启用真实区块链交互（需要私钥）
    get enabled() {
      const envValue = process.env.NEXT_PUBLIC_BLOCKCHAIN_ENABLED;
      if (envValue !== undefined) {
        return envValue === 'true';
      }
      // 默认跟随生产模式
      return config.isProduction;
    },
    
    // 是否启用链上记录（Memo 交易）
    get enableMemo() {
      const envValue = process.env.NEXT_PUBLIC_MEMO_ENABLED;
      if (envValue !== undefined) {
        return envValue === 'true';
      }
      // 默认：生产模式启用，演示模式禁用
      return config.isProduction;
    },
    
    // Solana 网络
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
    
    // RPC URL
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    
    // 是否配置了私钥
    get hasPayerKey() {
      return !!process.env.SOLANA_PAYER_SECRET_KEY;
    },
  },
  
  // VRF 配置
  vrf: {
    // VRF 提供者：demo（模拟）、blockhash（Solana区块哈希，免费）、orao（ORAO VRF，付费）
    provider: (process.env.NEXT_PUBLIC_VRF_PROVIDER || 'demo') as 'demo' | 'blockhash' | 'orao',
    
    // 是否使用真实链上随机（blockhash 或 orao）
    get useReal() {
      return this.provider !== 'demo';
    },
    
    // 是否使用 ORAO VRF（需要付费）
    get useOrao() {
      return this.provider === 'orao';
    },
    
    // ORAO VRF Program ID（Mainnet/Devnet 通用）
    programId: process.env.ORAO_VRF_PROGRAM_ID || 'VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y',
  },
  
  // 游戏配置
  game: {
    // 每局间隔（秒）
    roundIntervalSeconds: parseInt(process.env.NEXT_PUBLIC_ROUND_INTERVAL || '60', 10),
    
    // 清场提前时间（秒）
    clearingLeadTimeSeconds: parseInt(process.env.NEXT_PUBLIC_CLEARING_LEAD_TIME || '10', 10),
    
    // 发牌延迟（毫秒）
    dealingDelayMs: parseInt(process.env.NEXT_PUBLIC_DEALING_DELAY || '1000', 10),
  },
  
  // UI 配置
  ui: {
    // 是否显示演示模式标识
    get showDemoLabel() {
      return config.isDemo;
    },
  },
  
  // Twitter 配置
  twitter: {
    // 是否启用 Twitter 自动发推
    get enabled() {
      return process.env.NEXT_PUBLIC_TWITTER_ENABLED === 'true';
    },
  },
} as const;

/**
 * 获取模式显示名称
 */
export function getModeName(): string {
  return config.isDemo ? '演示模式' : '生产模式';
}

/**
 * 获取 VRF 提供者名称
 */
export function getVrfProviderName(): string {
  switch (config.vrf.provider) {
    case 'blockhash': return 'Solana 区块哈希（免费）';
    case 'orao': return 'ORAO VRF（付费）';
    case 'demo':
    default: return '模拟随机数';
  }
}

/**
 * 日志：当前配置
 */
export function logConfig(): void {
  console.log('🔧 OpenBaccarat 配置:');
  console.log(`   模式: ${getModeName()}`);
  console.log(`   数据库写入: ${config.database.enableWrite ? '启用' : '禁用'}`);
  console.log(`   链上记录: ${config.blockchain.enableMemo ? '启用' : '禁用'}${config.blockchain.enableMemo && !config.blockchain.hasPayerKey ? ' (⚠️ 需要私钥)' : ''}`);
  console.log(`   VRF: ${getVrfProviderName()}`);
  console.log(`   Twitter 发推: ${config.twitter.enabled ? '启用' : '禁用'}`);
  console.log(`   每局间隔: ${config.game.roundIntervalSeconds}秒`);
}
