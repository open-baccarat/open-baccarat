// ============================================
// OpenBaccarat - API 文档
// 返回 JSON 格式的 API 文档，方便 AI 和程序理解
// ============================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.open-baccarat.com';
  
  const apiDocs = {
    openapi: '3.0.0',
    info: {
      title: 'OpenBaccarat API',
      version: '1.0.0',
      description: 'Open-source, transparent, and blockchain-verifiable Baccarat game API. All game results are recorded on Solana blockchain.',
      contact: {
        url: 'https://github.com/chuciqin/OpenBaccarat',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Production server',
      },
    ],
    
    // API 概览 - 方便 AI 快速理解
    'x-ai-summary': {
      purpose: 'Query baccarat game results that are recorded on Solana blockchain',
      quickStart: {
        getLatestRounds: 'GET /api/rounds?limit=10',
        getRoundByNumber: 'GET /api/games/{roundNumber}',
        getRoundRange: 'GET /api/rounds?roundFrom=1&roundTo=100',
        getByResult: 'GET /api/rounds?result=banker_win',
      },
      dataFormats: {
        full: 'Complete data including cards, timing, blockchain info',
        compact: 'Essential fields only, no card details',
        minimal: 'Just result and totals',
      },
      resultTypes: ['banker_win', 'player_win', 'tie'],
      cardSuits: ['spade', 'heart', 'diamond', 'club'],
      cardRanks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    },

    paths: {
      '/api/games/{id}': {
        get: {
          summary: 'Get single round by number or ID',
          description: 'Retrieve detailed information about a specific game round. Supports both round number (integer) and UUID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Round number (1, 2, 3...) or UUID',
              schema: { type: 'string' },
              examples: {
                roundNumber: { value: '42', summary: 'By round number' },
                uuid: { value: 'uuid-string', summary: 'By UUID' },
              },
            },
          ],
          responses: {
            200: {
              description: 'Round found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RoundResponse' },
                },
              },
            },
            404: {
              description: 'Round not found',
            },
          },
        },
      },
      
      '/api/rounds': {
        get: {
          summary: 'Query rounds with flexible filters',
          description: 'Search and filter game rounds with various parameters. Supports pagination and multiple output formats.',
          parameters: [
            {
              name: 'roundNumber',
              in: 'query',
              description: 'Exact round number',
              schema: { type: 'integer' },
            },
            {
              name: 'roundFrom',
              in: 'query',
              description: 'Minimum round number (inclusive)',
              schema: { type: 'integer' },
            },
            {
              name: 'roundTo',
              in: 'query',
              description: 'Maximum round number (inclusive)',
              schema: { type: 'integer' },
            },
            {
              name: 'shoeNumber',
              in: 'query',
              description: 'Filter by shoe number',
              schema: { type: 'integer' },
            },
            {
              name: 'result',
              in: 'query',
              description: 'Filter by game result',
              schema: { type: 'string', enum: ['banker_win', 'player_win', 'tie'] },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of results (max 100)',
              schema: { type: 'integer', default: 20, maximum: 100 },
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Skip N results',
              schema: { type: 'integer', default: 0 },
            },
            {
              name: 'order',
              in: 'query',
              description: 'Sort order',
              schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            },
            {
              name: 'format',
              in: 'query',
              description: 'Response format (affects data verbosity)',
              schema: { type: 'string', enum: ['full', 'compact', 'minimal'], default: 'full' },
            },
          ],
          responses: {
            200: {
              description: 'Query results',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RoundsListResponse' },
                },
              },
            },
          },
        },
      },

      '/api/games': {
        get: {
          summary: 'List game history (paginated)',
          description: 'Get paginated list of game history. Use /api/rounds for more flexible querying.',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'shoeId',
              in: 'query',
              description: 'Filter by shoe UUID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Paginated game list',
            },
          },
        },
      },

      '/api/stats': {
        get: {
          summary: 'Get game statistics',
          description: 'Returns aggregated statistics: total rounds, banker wins, player wins, ties, pairs',
          responses: {
            200: {
              description: 'Statistics data',
            },
          },
        },
      },

      '/api/shoes': {
        get: {
          summary: 'List all shoes',
          description: 'Get list of all shoe (deck) sessions',
        },
      },

      '/api/shoes/{id}': {
        get: {
          summary: 'Get shoe details',
          description: 'Get detailed information about a specific shoe',
        },
      },

      '/api/verify': {
        get: {
          summary: 'Verify blockchain transaction',
          description: 'Verify a game result against its blockchain record',
          parameters: [
            {
              name: 'signature',
              in: 'query',
              required: true,
              description: 'Solana transaction signature',
              schema: { type: 'string' },
            },
          ],
        },
      },
    },

    components: {
      schemas: {
        Card: {
          type: 'object',
          properties: {
            suit: { type: 'string', enum: ['spade', 'heart', 'diamond', 'club'] },
            rank: { type: 'string', enum: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] },
            display: { type: 'string', description: 'Human-readable format like "A♠"' },
          },
        },
        
        RoundResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                roundNumber: { type: 'integer' },
                shoeNumber: { type: 'integer' },
                result: { type: 'string', enum: ['banker_win', 'player_win', 'tie'] },
                player: {
                  type: 'object',
                  properties: {
                    cards: { type: 'array', items: { $ref: '#/components/schemas/Card' } },
                    total: { type: 'integer', minimum: 0, maximum: 9 },
                    isPair: { type: 'boolean' },
                  },
                },
                banker: {
                  type: 'object',
                  properties: {
                    cards: { type: 'array', items: { $ref: '#/components/schemas/Card' } },
                    total: { type: 'integer', minimum: 0, maximum: 9 },
                    isPair: { type: 'boolean' },
                  },
                },
                isNatural: { type: 'boolean', description: 'True if player or banker has 8 or 9' },
                blockchain: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
                    solanaSignature: { type: 'string', nullable: true },
                    explorerUrl: { type: 'string', nullable: true },
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                latencyMs: { type: 'integer' },
              },
            },
          },
        },

        RoundsListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                    hasMore: { type: 'boolean' },
                  },
                },
              },
            },
            query: { type: 'object', description: 'Echoes back the query parameters used' },
          },
        },
      },
    },

    // 使用示例 - 方便 AI 学习
    'x-examples': {
      getLatest10Rounds: {
        description: 'Get the 10 most recent rounds',
        request: 'GET /api/rounds?limit=10&format=compact',
      },
      getBankerWins: {
        description: 'Get all banker wins from shoe #3',
        request: 'GET /api/rounds?shoeNumber=3&result=banker_win',
      },
      getRoundRange: {
        description: 'Get rounds 50-100 in ascending order',
        request: 'GET /api/rounds?roundFrom=50&roundTo=100&order=asc',
      },
      getMinimalData: {
        description: 'Get minimal data for fast processing',
        request: 'GET /api/rounds?format=minimal&limit=50',
      },
      getSingleRound: {
        description: 'Get complete details for round #42',
        request: 'GET /api/games/42',
      },
    },
  };

  return NextResponse.json(apiDocs, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
