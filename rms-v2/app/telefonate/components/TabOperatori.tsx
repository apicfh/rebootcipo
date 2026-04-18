'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { OperatoreStatistiche, CodaOperatore, SerieTemporaleOperatore, DistribuzioneOraria } from '../types';

interface TabOperatoriProps {
  operatoriList: Array<{ id: bigint; nome: string; profilo: string }>;
  selectedOperatore: string;
  selectedOperatoreNome: string;
  loadingOperatore: boolean;
  handleOperatoreChange: (profilo: string, nome: string) => void;
  operatoreStatistiche: OperatoreStatistiche | null;
  operatoreCodaDistribution: CodaOperatore[];
  operatoreSerieTemporale: SerieTemporaleOperatore[];
  operatoreDistribuzioneOraria: DistribuzioneOraria[];
}

export function TabOperatori({
  operatoriList,
  selectedOperatore,
  selectedOperatoreNome,
  loadingOperatore,
  handleOperatoreChange,
  operatoreStatistiche,
  operatoreCodaDistribution,
  operatoreSerieTemporale,
  operatoreDistribuzioneOraria,
}: TabOperatoriProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-muted/30">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Seleziona Agente</h2>
          <select
            value={selectedOperatore}
            onChange={(e) => {
              const selected = operatoriList.find(a => a.profilo === e.target.value);
              handleOperatoreChange(e.target.value, selected?.nome || '');
            }}
            disabled={loadingOperatore || operatoriList.length === 0}
            className="w-full md:w-96 px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">-- Seleziona un agente --</option>
            {operatoriList.map((agente) => (
              <option key={agente.profilo} value={agente.profilo}>
                {agente.nome}
              </option>
            ))}
          </select>
          {selectedOperatore && (
            <p className="text-sm text-muted-foreground">
              Visualizzando dati per l'agente <span className="font-semibold text-foreground">{selectedOperatoreNome}</span>
            </p>
          )}
        </div>
      </Card>

      {selectedOperatore && operatoreStatistiche && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Chiamate Totali</p>
              <p className="text-2xl font-bold text-foreground">{operatoreStatistiche.totale_chiamate}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Chiamate Risposte</p>
              <p className="text-2xl font-bold text-green-600">{operatoreStatistiche.chiamate_risposte}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Tasso Risposta</p>
              <p className="text-2xl font-bold text-blue-600">{operatoreStatistiche.tasso_risposta.toFixed(1)}%</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Giorni Analisi</p>
              <p className="text-2xl font-bold text-foreground">{operatoreStatistiche.giorni_analisi}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Coda Riferimento</p>
              <p className="text-xl font-bold text-foreground truncate">{operatoreStatistiche.coda_riferimento || '--'}</p>
            </div>
          </Card>
        </div>
      )}

      {selectedOperatore && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Distribuzione Code</h2>
              {operatoreCodaDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={operatoreCodaDistribution}
                      dataKey="count_coda"
                      nameKey="coda"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.coda}: ${entry.count_coda}`}
                      labelLine={false}
                    >
                      {operatoreCodaDistribution.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'][idx % 7]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">Nessun dato disponibile</div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Distribuzione Oraria</h2>
              {operatoreDistribuzioneOraria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={operatoreDistribuzioneOraria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="ora" stroke="#888" />
                    <YAxis stroke="#888" />
                    <RechartsTooltip />
                    <Bar dataKey="count_chiamate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">Nessun dato disponibile</div>
              )}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Serie Temporale Giornaliera</h2>
              {operatoreSerieTemporale.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={operatoreSerieTemporale}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="data" stroke="#888" />
                    <YAxis stroke="#888" />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="count_chiamate" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">Nessun dato disponibile</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
