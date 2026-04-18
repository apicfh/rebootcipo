'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { KPIData } from '../types';

interface SectionKPIProps {
  kpiData: KPIData;
}

export function SectionKPI({ kpiData }: SectionKPIProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Prenotazioni Oggi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold text-foreground">{kpiData.oggi}</div>
              <CardDescription className="text-xs mt-1">{new Date().toLocaleDateString('it-IT')}</CardDescription>
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">1 anno fa:</span>
                <span className="font-medium text-foreground">{kpiData.oggi_anno_1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">2 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.oggi_anno_2}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">3 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.oggi_anno_3}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ultimi 7 Giorni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold text-foreground">{kpiData.ultimi7giorni}</div>
              <CardDescription className="text-xs mt-1">Ultimi 7 giorni</CardDescription>
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">1 anno fa:</span>
                <span className="font-medium text-foreground">{kpiData.ultimi7giorni_anno_1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">2 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.ultimi7giorni_anno_2}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">3 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.ultimi7giorni_anno_3}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ultimi 30 Giorni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold text-foreground">{kpiData.ultimi30giorni}</div>
              <CardDescription className="text-xs mt-1">Ultimi 30 giorni</CardDescription>
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">1 anno fa:</span>
                <span className="font-medium text-foreground">{kpiData.ultimi30giorni_anno_1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">2 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.ultimi30giorni_anno_2}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">3 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.ultimi30giorni_anno_3}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totale Stagione</CardTitle>
          <CardDescription>
            Totale prenotazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold text-foreground">{kpiData.totaleStazione}</div>
              <CardDescription className="text-xs mt-1">Totale prenotazioni</CardDescription>
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">1 anno fa:</span>
                <span className="font-medium text-foreground">{kpiData.totaleStazione_anno_1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">2 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.totaleStazione_anno_2}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">3 anni fa:</span>
                <span className="font-medium text-foreground">{kpiData.totaleStazione_anno_3}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
