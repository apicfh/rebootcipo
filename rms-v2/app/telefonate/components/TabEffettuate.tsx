'use client';

import { Dispatch, SetStateAction } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import type { KPIMetrics, OperatoreOutboundStatistiche, SerieTemporaleOutbound } from '../types';

type EsitoSeries = { ANSWERED: boolean; 'NO ANSWER': boolean; BUSY: boolean };

interface TabEffettuateProps {
  currentKPI: KPIMetrics | null;
  outboundTimeSeries: Array<{ date: string; count: number }>;
  showDetailedSeriesOutbound: boolean;
  setShowDetailedSeriesOutbound: (v: boolean) => void;
  outboundTimeSeriesDetailed: Array<{ date: string; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>;
  visibleSeriesOutbound: EsitoSeries;
  setVisibleSeriesOutbound: Dispatch<SetStateAction<EsitoSeries>>;
  outboundHeatmap: Array<{ ora: number; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>;
  visibleHeatmapSeriesOutbound: EsitoSeries;
  setVisibleHeatmapSeriesOutbound: Dispatch<SetStateAction<EsitoSeries>>;
  operatoriOutboundList: Array<{ profilo_senza_sigla: string; nome: string }>;
  selectedOperatoreOutbound: string;
  selectedOperatoreOutboundNome: string;
  loadingOperatoreOutbound: boolean;
  handleOperatoreOutboundChange: (profilo: string, nome: string) => void;
  operatoreOutboundStatistiche: OperatoreOutboundStatistiche | null;
  operatoreOutboundSerieTemporale: SerieTemporaleOutbound[];
  bestMaxChiamate: { nome: string; totale_chiamate: number } | null;
  bestRapportoSuccesso: { nome: string; rapporto_successo: number } | null;
  bestDurataTotale: { nome: string; durata_totale_secondi: number } | null;
  bestDurataMediaMin: { nome: string; durata_media_secondi: number } | null;
  bestDurataMediaMax: { nome: string; durata_media_secondi: number } | null;
}

const ESITI = ['ANSWERED', 'NO ANSWER', 'BUSY'] as const;
const ESITO_COLORS: Record<string, string> = {
  ANSWERED: '#22c55e',
  'NO ANSWER': '#ef4444',
  BUSY: '#eab308',
};

export function TabEffettuate({
  currentKPI,
  outboundTimeSeries,
  showDetailedSeriesOutbound,
  setShowDetailedSeriesOutbound,
  outboundTimeSeriesDetailed,
  visibleSeriesOutbound,
  setVisibleSeriesOutbound,
  outboundHeatmap,
  visibleHeatmapSeriesOutbound,
  setVisibleHeatmapSeriesOutbound,
  operatoriOutboundList,
  selectedOperatoreOutbound,
  selectedOperatoreOutboundNome,
  loadingOperatoreOutbound,
  handleOperatoreOutboundChange,
  operatoreOutboundStatistiche,
  operatoreOutboundSerieTemporale,
  bestMaxChiamate,
  bestRapportoSuccesso,
  bestDurataTotale,
  bestDurataMediaMin,
  bestDurataMediaMax,
}: TabEffettuateProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Totale Chiamate</h3>
            <div className="text-3xl font-bold text-foreground">{currentKPI?.totaleChiamate || '--'}</div>
            <p className="text-xs text-muted-foreground">Numero totale di chiamate effettuate</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Risposte</h3>
            <div className="text-3xl font-bold text-foreground">{currentKPI?.risposte || '--'}</div>
            <p className="text-xs text-muted-foreground">Chiamate con esito ANSWERED</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Durata Totale</h3>
            <div className="text-3xl font-bold text-foreground">{currentKPI?.durataTotale || '--'}s</div>
            <p className="text-xs text-muted-foreground">Secondi totali delle chiamate risposte</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Top 3 Agenti Chiamanti</h3>
            <div className="text-sm font-bold text-foreground space-y-1">
              {currentKPI?.topNumeri && currentKPI.topNumeri.length > 0 ? (
                currentKPI.topNumeri.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    {item.numero} ({item.count})
                  </div>
                ))
              ) : (
                <div className="text-xs">--</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Agenti con più effettuate</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Tasso Conversione</h3>
            <div className="text-3xl font-bold text-foreground">{currentKPI?.tassoConversione || '--'}%</div>
            <p className="text-xs text-muted-foreground">Rapporto risposte/totale</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Serie Temporale Chiamate</h2>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDetailedSeriesOutbound}
                  onChange={(e) => setShowDetailedSeriesOutbound(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-muted-foreground">Spacchetta</span>
              </label>
            </div>
            {showDetailedSeriesOutbound ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={outboundTimeSeriesDetailed}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#888" />
                    <RechartsTooltip />
                    {visibleSeriesOutbound.ANSWERED && (
                      <Line type="monotone" dataKey="ANSWERED" stroke="#22c55e" dot={false} isAnimationActive={false} name="ANSWERED" />
                    )}
                    {visibleSeriesOutbound['NO ANSWER'] && (
                      <Line type="monotone" dataKey="NO ANSWER" stroke="#ef4444" dot={false} isAnimationActive={false} name="NO ANSWER" />
                    )}
                    {visibleSeriesOutbound.BUSY && (
                      <Line type="monotone" dataKey="BUSY" stroke="#eab308" dot={false} isAnimationActive={false} name="BUSY" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 flex-wrap">
                  {ESITI.map(esito => (
                    <button
                      key={esito}
                      onClick={() => setVisibleSeriesOutbound(prev => ({ ...prev, [esito]: !prev[esito] }))}
                      className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-1 rounded transition-colors ${
                        visibleSeriesOutbound[esito] ? 'hover:bg-muted' : 'opacity-50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-3 h-0.5" style={{ backgroundColor: ESITO_COLORS[esito] }} />
                      <span style={{ textDecoration: !visibleSeriesOutbound[esito] ? 'line-through' : 'none' }}>{esito}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={outboundTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Mappa Calore Oraria (08:00 - 21:00)</h2>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={outboundHeatmap} margin={{ bottom: 5, left: 0, right: 0, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="ora" stroke="#888" />
                  <YAxis stroke="#888" />
                  <RechartsTooltip />
                  {visibleHeatmapSeriesOutbound.ANSWERED && <Bar dataKey="ANSWERED" stackId="a" fill="#22c55e" />}
                  {visibleHeatmapSeriesOutbound['NO ANSWER'] && <Bar dataKey="NO ANSWER" stackId="a" fill="#ef4444" />}
                  {visibleHeatmapSeriesOutbound.BUSY && <Bar dataKey="BUSY" stackId="a" fill="#eab308" />}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 flex-wrap">
                {ESITI.map(esito => (
                  <button
                    key={esito}
                    onClick={() => setVisibleHeatmapSeriesOutbound(prev => ({ ...prev, [esito]: !prev[esito] }))}
                    className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-1 rounded transition-colors ${
                      visibleHeatmapSeriesOutbound[esito] ? 'hover:bg-muted' : 'opacity-50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-3 h-3" style={{ backgroundColor: ESITO_COLORS[esito] }} />
                    <span style={{ textDecoration: !visibleHeatmapSeriesOutbound[esito] ? 'line-through' : 'none' }}>{esito}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-muted/30 mt-8">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Analisi Operatori - Seleziona Agente</h2>
          <select
            value={selectedOperatoreOutbound}
            onChange={(e) => {
              const selected = operatoriOutboundList.find(a => a.profilo_senza_sigla === e.target.value);
              handleOperatoreOutboundChange(e.target.value, selected?.nome || '');
            }}
            disabled={loadingOperatoreOutbound || operatoriOutboundList.length === 0}
            className="w-full md:w-96 px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">-- Seleziona un agente --</option>
            {operatoriOutboundList.map((agente) => (
              <option key={agente.profilo_senza_sigla} value={agente.profilo_senza_sigla}>
                {agente.nome}
              </option>
            ))}
          </select>
          {selectedOperatoreOutbound && (
            <p className="text-sm text-muted-foreground">
              Visualizzando dati per l'agente <span className="font-semibold text-foreground">{selectedOperatoreOutboundNome}</span>
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {bestMaxChiamate && (
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">STACANOVISTA - RECORD CHIAMATE PRESE</p>
              <p className="text-2xl font-bold text-blue-600">{bestMaxChiamate.nome}</p>
              <p className="text-sm text-foreground">{bestMaxChiamate.totale_chiamate} chiamate</p>
            </div>
          </Card>
        )}

        {selectedOperatoreOutbound && operatoreOutboundStatistiche && (
          <>
            <Card className="p-4 text-center">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">Durata Media OPERATORE SELEZIONATO</p>
                <p className="text-2xl font-bold text-blue-600">{operatoreOutboundStatistiche.durata_media_secondi.toFixed(0)}s</p>
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">Totale Chiamate OPERATORE SELEZIONATO</p>
                <p className="text-2xl font-bold text-foreground">{operatoreOutboundStatistiche.totale_chiamate}</p>
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">TASSO DI RISPOSTA EFFETTUATE</p>
                <p className="text-2xl font-bold text-green-600">{operatoreOutboundStatistiche.rapporto_successo.toFixed(1)}%</p>
              </div>
            </Card>
          </>
        )}

        {bestDurataTotale && (
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">PER TE HO SEMPRE TEMPO - MAGGIOR MINUTAGGIO AL TELEFONO</p>
              <p className="text-2xl font-bold text-purple-600">{bestDurataTotale.nome}</p>
              <p className="text-sm text-foreground">{Math.floor(bestDurataTotale.durata_totale_secondi / 3600)}h {Math.floor((bestDurataTotale.durata_totale_secondi % 3600) / 60)}m</p>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex flex-col gap-4">
          {bestDurataMediaMax && (
            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">PARLA CHE TI PASSA - MAGGIOR DURATA MEDIA</p>
                <p className="text-2xl font-bold text-red-600">{bestDurataMediaMax.nome}</p>
                <p className="text-sm text-foreground">{bestDurataMediaMax.durata_media_secondi.toFixed(0)}s media</p>
              </div>
            </Card>
          )}
          {bestRapportoSuccesso && bestRapportoSuccesso.rapporto_successo > 0 && (
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">FORTUNELLO - BEST TASSO RISPOSTA EFFETTUATE</p>
                <p className="text-2xl font-bold text-green-600">{bestRapportoSuccesso.nome}</p>
                <p className="text-sm text-foreground">{bestRapportoSuccesso.rapporto_successo.toFixed(1)}%</p>
              </div>
            </Card>
          )}
        </div>

        {selectedOperatoreOutbound && operatoreOutboundSerieTemporale.length > 0 && (
          <Card className="p-6 md:col-span-3">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Andamento Chiamate - {selectedOperatoreOutboundNome}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={operatoreOutboundSerieTemporale}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="data" stroke="#888" />
                  <YAxis stroke="#888" />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="count_chiamate" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {bestDurataMediaMin && (
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">POCHE CHIACCHIERE - MINOR DURATA MEDIA</p>
                <p className="text-2xl font-bold text-orange-600">{bestDurataMediaMin.nome}</p>
                <p className="text-sm text-foreground">{bestDurataMediaMin.durata_media_secondi.toFixed(0)}s media</p>
              </div>
            </Card>
          )}
          {selectedOperatoreOutbound && operatoreOutboundStatistiche && (
            <Card className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 text-center">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">TEMPO AL TEL OPERATORE SELEZIONATO</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {Math.floor(operatoreOutboundStatistiche.durata_totale_secondi / 3600)}h {Math.floor((operatoreOutboundStatistiche.durata_totale_secondi % 3600) / 60)}m
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
