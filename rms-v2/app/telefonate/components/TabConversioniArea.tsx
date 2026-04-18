'use client';

import { Dispatch, SetStateAction } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import type { ConversioniAreaItem, DrilldownItem, ModeConversioniArea } from '../types';

interface TabConversioniAreaProps {
  dateRange: { from: string; to: string };
  setDateRange: Dispatch<SetStateAction<{ from: string; to: string }>>;
  durataMinima: number;
  setDurataMinima: (v: number) => void;
  modeConversioniArea: ModeConversioniArea;
  setModeConversioniArea: (v: ModeConversioniArea) => void;
  handleConversioniAreaRicerca: () => void;
  loadingConversioniArea: boolean;
  conversioniAreaData: ConversioniAreaItem[];
  drilldownArea: { area_id: string; nome_area: string } | null;
  setDrilldownArea: (v: { area_id: string; nome_area: string } | null) => void;
  drilldownData: DrilldownItem[];
  loadingDrilldown: boolean;
  drilldownPage: number;
  setDrilldownPage: Dispatch<SetStateAction<number>>;
  drilldownSort: { key: string; dir: 'asc' | 'desc' };
  setDrilldownSort: (v: { key: string; dir: 'asc' | 'desc' }) => void;
  handleDrilldownArea: (area: { area_id: string; nome_area: string }) => void;
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#94a3b8'];

export function TabConversioniArea({
  dateRange,
  setDateRange,
  durataMinima,
  setDurataMinima,
  modeConversioniArea,
  setModeConversioniArea,
  handleConversioniAreaRicerca,
  loadingConversioniArea,
  conversioniAreaData,
  drilldownArea,
  setDrilldownArea,
  drilldownData,
  loadingDrilldown,
  drilldownPage,
  setDrilldownPage,
  drilldownSort,
  setDrilldownSort,
  handleDrilldownArea,
}: TabConversioniAreaProps) {
  return (
    <>
      <div className="space-y-6">
        <Card className="p-6 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Filtri</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-muted transition-colors">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">Le date sono riferite a data prenotazione. Scegliendo un range, il sistema recupera tutte le prenotazioni inserite in quel periodo e cerca le telefonate relative alle prenotazioni entro 10 giorni prima dalla data di prenotazione. Settando la durata minima in secondi escludiamo le chiamate errate. Si puo scegliere tra conteggiare tutte le chiamate o solo le chiamate risposte.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Data Inizio</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Data Fine</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Durata Minima (sec)</label>
              <input
                type="number"
                min="0"
                value={durataMinima}
                onChange={(e) => setDurataMinima(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Modalita Calcolo</label>
              <select
                value={modeConversioniArea}
                onChange={(e) => setModeConversioniArea(e.target.value as ModeConversioniArea)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all_calls">Tutte le chiamate</option>
                <option value="answered_calls">Solo risposte</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleConversioniAreaRicerca}
              disabled={!dateRange.from || !dateRange.to || loadingConversioniArea}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loadingConversioniArea ? 'Caricamento...' : 'Analizza'}
            </button>
          </div>
        </Card>

        {conversioniAreaData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground uppercase">Totale Chiamate</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">Totale chiamate in entrata ed uscita</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {conversioniAreaData.reduce((sum, a) => sum + Number(a.totale_chiamate), 0).toLocaleString('it-IT')}
              </p>
            </Card>
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground uppercase">Chiamate Risposte</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">Totale chiamate risposte sia ricevute sia effettuate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {conversioniAreaData.reduce((sum, a) => sum + Number(a.totale_chiamate_risposte), 0).toLocaleString('it-IT')}
              </p>
            </Card>
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground uppercase">Conversioni</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">Conteggio di tutte le telefonate fatte da/verso un numero che ha anche una prenotazione nel range date indicato</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {conversioniAreaData.reduce((sum, a) => sum + Number(a.totale_chiamate_che_hanno_portato_a_conversione), 0).toLocaleString('it-IT')}
              </p>
            </Card>
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground uppercase">Tasso Conversione Medio</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">Chiamate da e verso numeri con prenotazione / totale chiamate * 100</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {conversioniAreaData.length > 0
                  ? (conversioniAreaData.reduce((sum, a) => sum + Number(a.conversion_rate), 0) / conversioniAreaData.length).toFixed(2)
                  : 0}%
              </p>
            </Card>
          </div>
        )}

        {conversioniAreaData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Dettaglio per Area</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Area</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Totale Chiamate</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Chiamate Risposte</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Conversioni</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Tasso Conv. %</th>
                  </tr>
                </thead>
                <tbody>
                  {conversioniAreaData.map((area, idx) => (
                    <tr key={area.area_id || idx} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium text-foreground">{area.nome_area}</td>
                      <td className="text-right py-3 px-4 text-foreground">{Number(area.totale_chiamate).toLocaleString('it-IT')}</td>
                      <td className="text-right py-3 px-4 text-foreground">{Number(area.totale_chiamate_risposte).toLocaleString('it-IT')}</td>
                      <td className="text-right py-3 px-4">
                        <button
                          onClick={() => handleDrilldownArea({ area_id: area.area_id, nome_area: area.nome_area })}
                          className="font-medium text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                        >
                          {Number(area.totale_chiamate_che_hanno_portato_a_conversione).toLocaleString('it-IT')}
                        </button>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          Number(area.conversion_rate) >= 10
                            ? 'bg-green-100 text-green-800'
                            : Number(area.conversion_rate) >= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {Number(area.conversion_rate).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-semibold">
                  <tr>
                    <td className="py-3 px-4 text-foreground">TOTALE</td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {conversioniAreaData.reduce((sum, a) => sum + Number(a.totale_chiamate), 0).toLocaleString('it-IT')}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {conversioniAreaData.reduce((sum, a) => sum + Number(a.totale_chiamate_risposte), 0).toLocaleString('it-IT')}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {conversioniAreaData.reduce((sum, a) => sum + Number(a.totale_chiamate_che_hanno_portato_a_conversione), 0).toLocaleString('it-IT')}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {conversioniAreaData.length > 0
                        ? (conversioniAreaData.reduce((sum, a) => sum + Number(a.conversion_rate), 0) / conversioniAreaData.length).toFixed(2)
                        : 0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {conversioniAreaData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Comparazione Aree</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversioniAreaData} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="nome_area" width={110} tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'conversion_rate') {
                        return [`${Number(value).toFixed(2)}%`, 'Tasso Conv.'];
                      }
                      return [Number(value).toLocaleString('it-IT'),
                        name === 'totale_chiamate' ? 'Totale Chiamate' :
                        name === 'totale_chiamate_risposte' ? 'Risposte' : 'Conversioni'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totale_chiamate" fill="#94a3b8" name="Totale Chiamate" />
                  <Bar dataKey="totale_chiamate_risposte" fill="#3b82f6" name="Risposte" />
                  <Bar dataKey="totale_chiamate_che_hanno_portato_a_conversione" fill="#22c55e" name="Conversioni" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {conversioniAreaData.length === 0 && !loadingConversioniArea && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Seleziona un intervallo di date e clicca su Analizza per visualizzare le conversioni per area.</p>
          </Card>
        )}
      </div>

      {drilldownArea && (() => {
        const inboundCount = drilldownData.filter(r => r.tipo_chiamata === 'inbound').length;
        const outboundCount = drilldownData.filter(r => r.tipo_chiamata === 'outbound').length;

        const agentiMap = drilldownData.reduce<Record<string, number>>((acc, r) => {
          const key = r.agente || 'Sconosciuto';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const agentiSorted = Object.entries(agentiMap).sort((a, b) => b[1] - a[1]);
        const top3 = agentiSorted.slice(0, 3);
        const altriCount = agentiSorted.slice(3).reduce((sum, [, v]) => sum + v, 0);
        const pieData = [
          ...top3.map(([nome, val]) => ({ name: nome, value: val })),
          ...(altriCount > 0 ? [{ name: 'Altri', value: altriCount }] : []),
        ];

        const sortedData = [...drilldownData].sort((a, b) => {
          const va = (a as any)[drilldownSort.key] ?? '';
          const vb = (b as any)[drilldownSort.key] ?? '';
          const cmp = String(va).localeCompare(String(vb), 'it', { numeric: true });
          return drilldownSort.dir === 'asc' ? cmp : -cmp;
        });
        const visibleRows = sortedData.slice(0, drilldownPage);
        const toggleSort = (key: string) => {
          setDrilldownSort({ key, dir: drilldownSort.key === key && drilldownSort.dir === 'asc' ? 'desc' : 'asc' });
          setDrilldownPage(20);
        };
        const SortIcon = ({ col }: { col: string }) => (
          <span className="ml-1 inline-block w-3 text-center">
            {drilldownSort.key === col ? (drilldownSort.dir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}
          </span>
        );

        return (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-5xl my-8">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Conversioni — {drilldownArea.nome_area}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {dateRange.from} / {dateRange.to} · durata min. {durataMinima}s
                    </p>
                  </div>
                  <button
                    onClick={() => setDrilldownArea(null)}
                    className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {loadingDrilldown && (
                  <p className="text-muted-foreground text-sm py-8 text-center">Caricamento...</p>
                )}

                {!loadingDrilldown && drilldownData.length === 0 && (
                  <p className="text-muted-foreground text-sm py-8 text-center">Nessun dato trovato.</p>
                )}

                {!loadingDrilldown && drilldownData.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-muted/30">
                        <p className="text-xs text-muted-foreground uppercase mb-3">Distribuzione tipo chiamata</p>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{inboundCount}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Inbound</p>
                          </div>
                          <div className="text-muted-foreground text-xl font-light">vs</div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{outboundCount}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Outbound</p>
                          </div>
                          <div className="flex-1 ml-4 space-y-1.5">
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                                <span>Inbound</span>
                                <span>{drilldownData.length > 0 ? Math.round(inboundCount / drilldownData.length * 100) : 0}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${drilldownData.length > 0 ? Math.round(inboundCount / drilldownData.length * 100) : 0}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                                <span>Outbound</span>
                                <span>{drilldownData.length > 0 ? Math.round(outboundCount / drilldownData.length * 100) : 0}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${drilldownData.length > 0 ? Math.round(outboundCount / drilldownData.length * 100) : 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/30">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Top agenti per conversioni</p>
                        <div className="flex items-center gap-2">
                          <div className="h-28 w-28 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={24} outerRadius={48}>
                                  {pieData.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(v: number, n: string) => [v, n]} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {pieData.map((entry, i) => (
                              <div key={entry.name} className="flex items-center gap-2 text-xs">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="truncate text-foreground">{entry.name}</span>
                                <span className="ml-auto font-medium text-foreground flex-shrink-0">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="overflow-x-auto border border-border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            {([
                              { key: 'hotel_nome', label: 'Hotel', align: 'left' },
                              { key: 'telefono_normalizzato_matchato', label: 'Telefono', align: 'left' },
                              { key: 'tipo_chiamata', label: 'Tipo', align: 'left' },
                              { key: 'data_chiamata', label: 'Data Chiamata', align: 'left' },
                              { key: 'ora_chiamata', label: 'Ora', align: 'left' },
                              { key: 'durata_secondi', label: 'Durata', align: 'right' },
                              { key: 'agente', label: 'Agente', align: 'left' },
                              { key: 'esito', label: 'Esito', align: 'left' },
                              { key: 'data_prenotazione', label: 'Data Preno.', align: 'left' },
                              { key: 'arrivo', label: 'Arrivo', align: 'left' },
                            ] as { key: string; label: string; align: 'left' | 'right' }[]).map(col => (
                              <th
                                key={col.key}
                                onClick={() => toggleSort(col.key)}
                                className={`py-2 px-3 font-medium text-foreground cursor-pointer select-none hover:bg-muted/80 transition-colors text-${col.align}`}
                              >
                                {col.label}<SortIcon col={col.key} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRows.map((row, idx) => (
                            <tr key={`${row.prenotazione_id}-${idx}`} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 px-3 text-foreground">{row.hotel_nome}</td>
                              <td className="py-2 px-3 text-foreground font-mono">{row.telefono_normalizzato_matchato}</td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  row.tipo_chiamata === 'inbound'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {row.tipo_chiamata}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-foreground">{row.data_chiamata}</td>
                              <td className="py-2 px-3 text-foreground">{String(row.ora_chiamata).slice(0, 5)}</td>
                              <td className="py-2 px-3 text-right text-foreground">
                                {Math.floor(row.durata_secondi / 60)}m {row.durata_secondi % 60}s
                              </td>
                              <td className="py-2 px-3 text-foreground">{row.agente}</td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  row.esito === 'ANSWERED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.esito}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-foreground">{row.data_prenotazione}</td>
                              <td className="py-2 px-3 text-foreground">{row.arrivo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Mostrando {visibleRows.length} di {drilldownData.length} righe</span>
                        {drilldownPage < drilldownData.length && (
                          <button
                            onClick={() => setDrilldownPage(p => p + 20)}
                            className="px-3 py-1 rounded bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                          >
                            Carica altri 20
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        );
      })()}
    </>
  );
}
