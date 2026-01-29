// ============================================
// OpenBaccarat - API 验证 Schema
// 使用 Zod 进行请求验证
// ============================================

import { z } from 'zod';

// 扑克牌花色
export const CardSuitSchema = z.enum(['spade', 'heart', 'diamond', 'club']);

// 扑克牌点数
export const CardRankSchema = z.enum(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);

// 扑克牌
export const CardSchema = z.object({
  suit: CardSuitSchema,
  rank: CardRankSchema,
});

// 游戏结果
export const GameResultSchema = z.enum(['player_win', 'banker_win', 'tie']);

// 对子信息
export const PairInfoSchema = z.object({
  player: z.boolean(),
  banker: z.boolean(),
});

// Memo API 请求体
export const MemoRequestSchema = z.object({
  id: z.string().min(1, '回合ID不能为空').max(100, '回合ID过长'),
  shoeId: z.string().min(1, '牌靴ID不能为空').max(100, '牌靴ID过长'),
  shoeNumber: z.number().int().min(1).optional(),
  roundNumber: z.number().int().min(1, '局号必须大于0'),
  result: GameResultSchema,
  playerCards: z.array(CardSchema).min(2, '闲家至少2张牌').max(3, '闲家最多3张牌'),
  bankerCards: z.array(CardSchema).min(2, '庄家至少2张牌').max(3, '庄家最多3张牌'),
  playerTotal: z.number().int().min(0, '闲家点数不能为负').max(9, '闲家点数最多9'),
  bankerTotal: z.number().int().min(0, '庄家点数不能为负').max(9, '庄家点数最多9'),
  isPair: PairInfoSchema,
  completedAtUnix: z.number().int().min(1, '完成时间戳不能为空'),
});

// 验证 API 请求参数
export const VerifyQuerySchema = z.object({
  signature: z.string()
    .min(80, '交易签名长度不正确')
    .max(100, '交易签名长度不正确')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, '交易签名格式不正确（应为 Base58 编码）'),
});

// 分页参数
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// 游戏历史查询参数
export const GamesQuerySchema = PaginationSchema.extend({
  shoeId: z.string().optional(),
});

// 牌靴 ID 参数
export const ShoeIdSchema = z.object({
  id: z.string().min(1, '牌靴ID不能为空'),
});

// 创建牌靴请求体
export const CreateShoeSchema = z.object({
  deckCount: z.number().int().min(1).max(8).default(8),
});

// 验证帮助函数
export type MemoRequest = z.infer<typeof MemoRequestSchema>;
export type VerifyQuery = z.infer<typeof VerifyQuerySchema>;
export type GamesQuery = z.infer<typeof GamesQuerySchema>;
export type Card = z.infer<typeof CardSchema>;

/**
 * 验证请求体并返回结果
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // 格式化错误信息
  const issues = result.error.issues || [];
  const errorMessages: string[] = [];
  
  for (const issue of issues) {
    const path = Array.isArray(issue.path) 
      ? issue.path.map(String).join('.') 
      : '';
    const message = issue.message || '验证失败';
    errorMessages.push(path ? `${path}: ${message}` : message);
  }
  
  return {
    success: false,
    error: errorMessages.join('; ') || '验证失败',
  };
}
