// ============================================
// OpenBaccarat - Twitter Image Generator
// Using Puppeteer for pixel-perfect screenshots
// Compatible with Vercel deployment
// ============================================

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { generateAllRoadmaps } from '@/lib/game/roadmap';
import type { RoadmapPoint, Round } from '@/types';

// Shoe complete image data
interface ShoeCompleteImageData {
  shoeNumber: number;
  rounds: Round[];
  stats: {
    bankerWins: number;
    playerWins: number;
    ties: number;
    naturals: number;
    bankerPairs: number;
    playerPairs: number;
  };
}

// Generate HTML for the image
function generateHTML(data: ShoeCompleteImageData): string {
  const roadmapData: RoadmapPoint[] = data.rounds.map(r => ({
    result: r.result,
    roundId: r.id,
    roundNumber: r.roundNumber,
    isPair: r.isPair,
  }));
  
  const roadmaps = generateAllRoadmaps(roadmapData);
  const totalRounds = data.rounds.length;
  const sortedRounds = [...data.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  
  // Generate roadmap HTML - EXACTLY matching website dimensions
  // Website: Big Road 40x6, Derived roads 20x6, Bead Plate 12x6
  // Use smaller sizes to leave more room for records
  const bigRoadHTML = generateRoadmapHTML(roadmaps.bigRoad, 40, 6, 26);      // 40 cols x 6 rows
  const bigEyeHTML = generateRoadmapHTML(roadmaps.bigEyeBoy, 20, 6, 28);     // 20 cols x 6 rows
  const cockroachHTML = generateRoadmapHTML(roadmaps.cockroachRoad, 20, 6, 28); // 20 cols x 6 rows
  const smallRoadHTML = generateRoadmapHTML(roadmaps.smallRoad, 20, 6, 28);  // 20 cols x 6 rows
  const beadPlateHTML = generateBeadPlateHTML(roadmaps.beadPlate, 12, 6, 28); // 12 cols x 6 rows - same height as left
  
  // Generate records HTML (7 columns, 79 rounds / 7 = ~12 per col)
  const numCols = 7;
  const roundsPerCol = Math.ceil(sortedRounds.length / numCols);
  let recordsHTML = '';
  
  for (let col = 0; col < numCols; col++) {
    const colRounds = sortedRounds.slice(col * roundsPerCol, (col + 1) * roundsPerCol);
    recordsHTML += `<div class="records-col">
      <div class="records-header">
        <span style="width:36px">#</span>
        <span style="width:60px">Result</span>
        <span style="width:24px">P</span>
        <span style="width:24px">B</span>
        <span style="flex:1">Pair</span>
      </div>
      ${colRounds.map(r => {
        const resultClass = r.result === 'banker_win' ? 'banker' : r.result === 'player_win' ? 'player' : 'tie';
        const resultLabel = r.result === 'banker_win' ? 'Banker' : r.result === 'player_win' ? 'Player' : 'Tie';
        const pair = [r.isPair.banker ? 'B' : '', r.isPair.player ? 'P' : ''].filter(Boolean).join(' ') || '-';
        return `<div class="record-row">
          <span class="round-num">#${r.roundNumber}</span>
          <span class="result-badge ${resultClass}">${resultLabel}</span>
          <span class="score">${r.playerTotal}</span>
          <span class="score">${r.bankerTotal}</span>
          <span class="pair">${pair}</span>
        </div>`;
      }).join('')}
    </div>`;
  }
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      width: 2200px;
      height: 1440px;
      padding: 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 52px;
      font-weight: bold;
      color: #10b981;
    }
    .badge {
      background: #18181b;
      border: 1px solid #27272a;
      color: #fff;
      padding: 16px 40px;
      border-radius: 30px;
      font-size: 26px;
    }
    .main-content {
      display: flex;
      gap: 16px;
    }
    .left-section {
      width: 1600px;
    }
    .right-section {
      flex: 1;
    }
    .roadmaps-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .roadmap-section {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .roadmap-title {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .roadmap-grid {
      background: rgba(0,0,0,0.3);
      padding: 6px;
      border-radius: 6px;
    }
    .cell {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
    }
    .cell.empty { background: rgba(80,80,80,0.4); }
    .cell.banker { background: #ef4444; }
    .cell.player { background: #3b82f6; }
    .cell.tie { background: #22c55e; }
    .derived-row {
      display: flex;
      gap: 16px;
    }
    .derived-col {
      flex: 1;
    }
    .derived-section {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 10px;
    }
    .derived-title {
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .records-section {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 14px;
      margin-top: 14px;
    }
    .records-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .records-title {
      color: #fff;
      font-size: 20px;
      font-weight: bold;
    }
    .records-count {
      color: rgba(255,255,255,0.5);
      font-size: 15px;
    }
    .records-grid {
      display: flex;
      gap: 12px;
    }
    .records-col {
      flex: 1;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 10px;
    }
    .records-header {
      display: flex;
      padding: 5px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      font-weight: bold;
    }
    .record-row {
      display: flex;
      align-items: center;
      padding: 3px 6px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 12px;
      color: #fff;
    }
    .round-num {
      width: 36px;
      color: rgba(255,255,255,0.5);
      font-size: 12px;
    }
    .result-badge {
      width: 60px;
      text-align: center;
      padding: 4px 0;
      border-radius: 5px;
      font-size: 11px;
      font-weight: bold;
      margin-right: 8px;
    }
    .result-badge.banker { background: #ef4444; }
    .result-badge.player { background: #3b82f6; }
    .result-badge.tie { background: #22c55e; }
    .score {
      width: 24px;
      font-weight: bold;
      font-size: 13px;
    }
    .pair {
      flex: 1;
      color: #fbbf24;
      font-weight: bold;
      font-size: 12px;
    }
    .stats-card {
      background: #fff;
      border-radius: 14px;
      padding: 28px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .stats-title {
      font-size: 32px;
      font-weight: bold;
      color: #18181b;
      margin-bottom: 24px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .stat-label { font-size: 22px; font-weight: 500; }
    .stat-label.banker { color: #DC2626; }
    .stat-label.player { color: #2563EB; }
    .stat-label.tie { color: #16A34A; }
    .stat-label.muted { color: #6B7280; }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #1F2937;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 0;
      margin-top: 12px;
      border-top: 3px solid #E5E7EB;
    }
    .total-label {
      font-size: 22px;
      color: #6B7280;
    }
    .total-value {
      font-size: 42px;
      font-weight: bold;
      color: #1F2937;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: auto;
      padding: 20px;
      background: #F9FAFB;
      border-radius: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
    }
    .legend-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    .legend-dot.banker { background: #ef4444; }
    .legend-dot.player { background: #3b82f6; }
    .legend-dot.tie { background: #22c55e; }
    .footer {
      text-align: center;
      color: rgba(255,255,255,0.4);
      font-size: 18px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🎴 OpenBaccarat</div>
    <div class="badge">Shoe #${data.shoeNumber} Complete - ${totalRounds} Rounds</div>
  </div>
  
  <div class="main-content">
    <div class="left-section">
      <!-- 大路 -->
      <div class="roadmap-section">
        <div class="roadmap-title">Big Road</div>
        <div class="roadmap-grid">${bigRoadHTML}</div>
      </div>
      
      <!-- 衍生路第一行: 大眼仔 + 蟑螂路 -->
      <div class="derived-row">
        <div class="derived-col">
          <div class="derived-section">
            <div class="derived-title">Big Eye Boy</div>
            <div class="roadmap-grid">${bigEyeHTML}</div>
          </div>
        </div>
        <div class="derived-col">
          <div class="derived-section">
            <div class="derived-title">Cockroach Road</div>
            <div class="roadmap-grid">${cockroachHTML}</div>
          </div>
        </div>
      </div>
      
      <!-- 衍生路第二行: 小路 + 珠盘路 -->
      <div class="derived-row" style="margin-top:16px">
        <div class="derived-col">
          <div class="derived-section">
            <div class="derived-title">Small Road</div>
            <div class="roadmap-grid">${smallRoadHTML}</div>
          </div>
        </div>
        <div class="derived-col">
          <div class="derived-section">
            <div class="derived-title">Bead Plate</div>
            <div class="roadmap-grid">${beadPlateHTML}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="right-section">
      <div class="stats-card">
        <div class="stats-title">Statistics</div>
        <div class="stat-row">
          <span class="stat-label banker">Banker Wins</span>
          <span class="stat-value">${data.stats.bankerWins}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label player">Player Wins</span>
          <span class="stat-value">${data.stats.playerWins}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label tie">Ties</span>
          <span class="stat-value">${data.stats.ties}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label muted">Naturals</span>
          <span class="stat-value">${data.stats.naturals}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label muted">Banker Pairs</span>
          <span class="stat-value">${data.stats.bankerPairs}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label muted">Player Pairs</span>
          <span class="stat-value">${data.stats.playerPairs}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label muted">Shoe Number</span>
          <span class="stat-value">#${data.shoeNumber}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Total Rounds:</span>
          <span class="total-value">${totalRounds}</span>
        </div>
        <div class="legend">
          <div class="legend-item"><div class="legend-dot banker"></div><span>B</span></div>
          <div class="legend-item"><div class="legend-dot player"></div><span>P</span></div>
          <div class="legend-item"><div class="legend-dot tie"></div><span>T</span></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 详细记录 -->
  <div class="records-section">
    <div class="records-title-row">
      <div class="records-title">📋 Detailed Records</div>
      <div class="records-count">${totalRounds} rounds</div>
    </div>
    <div class="records-grid">${recordsHTML}</div>
  </div>
  
  <div class="footer">open-baccarat.com - Open Source · MIT License · Transparent & Verifiable on Solana</div>
</body>
</html>`;
}

// Generate roadmap grid HTML with explicit grid layout (cols x rows)
function generateRoadmapHTML(grid: any[][], cols: number, rows: number, size: number): string {
  let cellsHTML = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[col]?.[row];
      const className = !cell?.result ? 'empty' 
        : cell.result === 'banker_win' ? 'banker' 
        : cell.result === 'player_win' ? 'player' 
        : 'tie';
      const tieText = cell?.tieCount && cell.tieCount > 0 ? cell.tieCount.toString() : '';
      cellsHTML += `<div class="cell ${className}" style="width:${size}px;height:${size}px;font-size:${size/2}px">${tieText}</div>`;
    }
  }
  // Use CSS Grid with exact column count
  return `<div style="display:grid;grid-template-columns:repeat(${cols},${size}px);gap:3px;">${cellsHTML}</div>`;
}

// Generate bead plate HTML with explicit grid layout (cols x rows)
function generateBeadPlateHTML(grid: any[][], cols: number, rows: number, size: number): string {
  let cellsHTML = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[col]?.[row];
      const className = !cell?.result ? 'empty' 
        : cell.result === 'banker_win' ? 'banker' 
        : cell.result === 'player_win' ? 'player' 
        : 'tie';
      const label = !cell?.result ? '' 
        : cell.result === 'banker_win' ? 'B' 
        : cell.result === 'player_win' ? 'P' 
        : 'T';
      cellsHTML += `<div class="cell ${className}" style="width:${size}px;height:${size}px;font-size:${size/2}px">${label}</div>`;
    }
  }
  // Use CSS Grid with exact column count
  return `<div style="display:grid;grid-template-columns:repeat(${cols},${size}px);gap:3px;">${cellsHTML}</div>`;
}

// Generate image using Puppeteer
export async function generateRoadmapImage(data: ShoeCompleteImageData): Promise<Buffer> {
  const html = generateHTML(data);
  
  // Get browser executable
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  let browser;
  try {
    if (isVercel) {
      // Vercel/Lambda environment
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 2200, height: 1440, deviceScaleFactor: 2 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Local development - use system Chrome
      const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      ];
      
      let executablePath = '';
      for (const p of possiblePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(p)) {
            executablePath = p;
            break;
          }
        } catch {}
      }
      
      browser = await puppeteer.launch({
        executablePath: executablePath || undefined,
        headless: true,
        defaultViewport: { width: 2200, height: 1440, deviceScaleFactor: 2 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 2200, height: 1440 },
    });
    
    await browser.close();
    
    return Buffer.from(screenshot);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Export legacy interface
export async function generateRoundImage(data: any): Promise<Buffer> {
  return generateRoadmapImage({
    shoeNumber: data.shoeNumber || 1,
    rounds: [],
    stats: { bankerWins: 0, playerWins: 0, ties: 0, naturals: 0, bankerPairs: 0, playerPairs: 0 },
  });
}
