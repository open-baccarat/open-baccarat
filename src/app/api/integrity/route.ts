import { NextResponse } from 'next/server';
import { 
  checkRoundDuplicates, 
  checkRoundGaps, 
  getMaxRoundNumber,
  checkShoeDuplicates,
  checkShoeGaps,
  getMaxShoeNumber,
} from '@/lib/supabase/queries';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IntegrityIssue {
  type: 'duplicate' | 'gap' | 'invalid_sequence';
  entity: 'round' | 'shoe';
  number: number;
  details: string;
  severity: 'error' | 'warning';
}

interface IntegrityReport {
  status: 'healthy' | 'issues_found';
  timestamp: string;
  rounds: {
    total: number;
    expectedMax: number;
    actualMax: number;
    duplicates: number[];
    gaps: number[];
  };
  shoes: {
    total: number;
    expectedMax: number;
    actualMax: number;
    duplicates: number[];
    gaps: number[];
  };
  issues: IntegrityIssue[];
  summary: {
    roundDuplicates: number;
    roundGaps: number;
    shoeDuplicates: number;
    shoeGaps: number;
    totalIssues: number;
  };
}

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // 并行获取所有数据
    const [
      { count: totalRounds },
      { count: totalShoes },
      roundDuplicatesData,
      roundGapsData,
      maxRound,
      shoeDuplicatesData,
      shoeGapsData,
      maxShoe,
    ] = await Promise.all([
      supabase.from('rounds').select('*', { count: 'exact', head: true }),
      supabase.from('shoes').select('*', { count: 'exact', head: true }),
      checkRoundDuplicates(),
      checkRoundGaps(),
      getMaxRoundNumber(),
      checkShoeDuplicates(),
      checkShoeGaps(),
      getMaxShoeNumber(),
    ]);
    
    const issues: IntegrityIssue[] = [];
    const roundDuplicates: number[] = [];
    const roundGaps: number[] = [];
    const shoeDuplicates: number[] = [];
    const shoeGaps: number[] = [];
    
    // 处理重复局号
    for (const dup of roundDuplicatesData) {
      roundDuplicates.push(dup.roundNumber);
      issues.push({
        type: 'duplicate',
        entity: 'round',
        number: dup.roundNumber,
        details: `局号 #${dup.roundNumber} 在数据库中出现 ${dup.count} 次`,
        severity: 'error',
      });
    }
    
    // 处理局号跳号
    for (const gap of roundGapsData) {
      roundGaps.push(gap);
      issues.push({
        type: 'gap',
        entity: 'round',
        number: gap,
        details: `局号 #${gap} 缺失`,
        severity: 'warning',
      });
    }
    
    // 处理重复牌靴号
    for (const dup of shoeDuplicatesData) {
      shoeDuplicates.push(dup.shoeNumber);
      issues.push({
        type: 'duplicate',
        entity: 'shoe',
        number: dup.shoeNumber,
        details: `牌靴 #${dup.shoeNumber} 在数据库中出现 ${dup.count} 次`,
        severity: 'error',
      });
    }
    
    // 处理牌靴跳号
    for (const gap of shoeGapsData) {
      shoeGaps.push(gap);
      issues.push({
        type: 'gap',
        entity: 'shoe',
        number: gap,
        details: `牌靴 #${gap} 缺失`,
        severity: 'warning',
      });
    }
    
    const report: IntegrityReport = {
      status: issues.length > 0 ? 'issues_found' : 'healthy',
      timestamp: new Date().toISOString(),
      rounds: {
        total: totalRounds || 0,
        expectedMax: totalRounds || 0,
        actualMax: maxRound,
        duplicates: roundDuplicates.slice(0, 50),
        gaps: roundGaps.slice(0, 50),
      },
      shoes: {
        total: totalShoes || 0,
        expectedMax: totalShoes || 0,
        actualMax: maxShoe,
        duplicates: shoeDuplicates.slice(0, 50),
        gaps: shoeGaps.slice(0, 50),
      },
      issues: issues.slice(0, 100),
      summary: {
        roundDuplicates: roundDuplicates.length,
        roundGaps: roundGaps.length,
        shoeDuplicates: shoeDuplicates.length,
        shoeGaps: shoeGaps.length,
        totalIssues: issues.length,
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
