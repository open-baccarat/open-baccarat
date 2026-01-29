import { NextResponse } from 'next/server';
import { 
  checkRoundDuplicates, 
  checkRoundGaps, 
  getMaxRoundNumber 
} from '@/lib/supabase/queries';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IntegrityIssue {
  type: 'duplicate' | 'gap' | 'invalid_sequence';
  roundNumber: number;
  details: string;
  severity: 'error' | 'warning';
}

interface IntegrityReport {
  status: 'healthy' | 'issues_found';
  timestamp: string;
  totalRounds: number;
  expectedMaxRound: number;
  actualMaxRound: number;
  issues: IntegrityIssue[];
  duplicates: number[];
  gaps: number[];
  summary: {
    duplicateCount: number;
    gapCount: number;
    missingRounds: number;
  };
}

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // 获取总局数和最大局号
    const { count: totalRounds } = await supabase
      .from('rounds')
      .select('*', { count: 'exact', head: true });
    
    if (!totalRounds || totalRounds === 0) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        totalRounds: 0,
        expectedMaxRound: 0,
        actualMaxRound: 0,
        issues: [],
        duplicates: [],
        gaps: [],
        summary: {
          duplicateCount: 0,
          gapCount: 0,
          missingRounds: 0,
        },
        message: 'No rounds found in database',
      } satisfies IntegrityReport & { message: string });
    }
    
    // 使用数据库函数检测问题（更高效）
    const [duplicatesData, gapsData, maxRound] = await Promise.all([
      checkRoundDuplicates(),
      checkRoundGaps(),
      getMaxRoundNumber(),
    ]);
    
    const issues: IntegrityIssue[] = [];
    const duplicates: number[] = [];
    const gaps: number[] = [];
    
    // 处理重复局号
    for (const dup of duplicatesData) {
      duplicates.push(dup.roundNumber);
      issues.push({
        type: 'duplicate',
        roundNumber: dup.roundNumber,
        details: `Round #${dup.roundNumber} appears ${dup.count} times in database`,
        severity: 'error',
      });
    }
    
    // 处理跳号
    for (const gap of gapsData) {
      gaps.push(gap);
      issues.push({
        type: 'gap',
        roundNumber: gap,
        details: `Round #${gap} is missing from the sequence`,
        severity: 'warning',
      });
    }
    
    const report: IntegrityReport = {
      status: issues.length > 0 ? 'issues_found' : 'healthy',
      timestamp: new Date().toISOString(),
      totalRounds,
      expectedMaxRound: totalRounds, // 如果从1开始连续的话
      actualMaxRound: maxRound,
      issues: issues.slice(0, 100), // 限制返回的问题数量
      duplicates: duplicates.slice(0, 50),
      gaps: gaps.slice(0, 50),
      summary: {
        duplicateCount: duplicates.length,
        gapCount: gaps.length,
        missingRounds: gaps.length,
      },
    };
    
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Integrity check failed:', error);
    return NextResponse.json({
      error: 'Integrity check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
