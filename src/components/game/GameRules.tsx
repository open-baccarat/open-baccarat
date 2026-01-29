// ============================================
// OpenBaccarat - 游戏规则说明
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GameRules() {
  const t = useTranslations('gameRules');

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="bg-zinc-800 w-full">
            <TabsTrigger value="basic" className="flex-1 text-xs">{t('tabs.basic')}</TabsTrigger>
            <TabsTrigger value="draw" className="flex-1 text-xs">{t('tabs.draw')}</TabsTrigger>
            <TabsTrigger value="payout" className="flex-1 text-xs">{t('tabs.payout')}</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[300px] mt-4">
            <TabsContent value="basic" className="mt-0 space-y-4">
              <RuleSection title={t('basic.objective')}>
                <p>{t('basic.objectiveDesc1')}</p>
                <p>{t('basic.objectiveDesc2')}</p>
              </RuleSection>

              <RuleSection title={t('basic.points')}>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('basic.pointsA')}</li>
                  <li>{t('basic.points2to9')}</li>
                  <li>{t('basic.points10')}</li>
                  <li>{t('basic.pointsOver9')}</li>
                </ul>
                <p className="text-emerald-400 mt-2">{t('basic.pointsExample')}</p>
              </RuleSection>

              <RuleSection title={t('basic.shoe')}>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('basic.shoe8Decks')}</li>
                  <li>{t('basic.shoeBurn')}</li>
                  <li>{t('basic.shoeReserve')}</li>
                </ul>
              </RuleSection>
            </TabsContent>

            <TabsContent value="draw" className="mt-0 space-y-4">
              <RuleSection title={t('draw.natural')}>
                <p>{t('draw.naturalDesc1')}</p>
                <p>{t('draw.naturalDesc2')}</p>
              </RuleSection>

              <RuleSection title={t('draw.player')}>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('draw.player0to5')}</li>
                  <li>{t('draw.player6to7')}</li>
                </ul>
              </RuleSection>

              <RuleSection title={t('draw.banker')}>
                <p className="text-zinc-400 mb-2">{t('draw.bankerDesc')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left p-2">{t('draw.bankerPoints')}</th>
                        <th className="text-left p-2">{t('draw.drawCondition')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400">
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">0-2</td>
                        <td className="p-2">{t('draw.banker0to2')}</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">3</td>
                        <td className="p-2">{t('draw.banker3')}</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">4</td>
                        <td className="p-2">{t('draw.banker4')}</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">5</td>
                        <td className="p-2">{t('draw.banker5')}</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">6</td>
                        <td className="p-2">{t('draw.banker6')}</td>
                      </tr>
                      <tr>
                        <td className="p-2">7</td>
                        <td className="p-2">{t('draw.banker7')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </RuleSection>
            </TabsContent>

            <TabsContent value="payout" className="mt-0 space-y-4">
              <RuleSection title={t('payout.standard')}>
                <div className="space-y-2">
                  <PayoutRow label={t('payout.bankerWin')} payout="1:0.95" note={t('payout.commission')} />
                  <PayoutRow label={t('payout.playerWin')} payout="1:1" />
                  <PayoutRow label={t('payout.tie')} payout="1:8" />
                  <PayoutRow label={t('payout.bankerPair')} payout="1:11" note={t('payout.bankerPairDesc')} />
                  <PayoutRow label={t('payout.playerPair')} payout="1:11" note={t('payout.playerPairDesc')} />
                </div>
              </RuleSection>

              <RuleSection title={t('payout.disclaimer')}>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 mb-2">
                  {t('payout.demoOnly')}
                </Badge>
                <p>{t('payout.disclaimerDesc1')}</p>
                <p>{t('payout.disclaimerDesc2')}</p>
              </RuleSection>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-white">{title}</h4>
      <div className="text-sm text-zinc-400 space-y-1">{children}</div>
    </div>
  );
}

function PayoutRow({ 
  label, 
  payout, 
  note 
}: { 
  label: string; 
  payout: string; 
  note?: string; 
}) {
  return (
    <div className="flex items-center justify-between bg-zinc-800/50 rounded p-2">
      <div>
        <span className="text-white">{label}</span>
        {note && <span className="text-xs text-zinc-500 ml-2">({note})</span>}
      </div>
      <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
        {payout}
      </Badge>
    </div>
  );
}
