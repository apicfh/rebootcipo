'use client';

import { Dispatch, SetStateAction } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { CallData, KPIMetrics, HotelNumber, CodaDistribution, ConversionAnalysis } from '../types';

type EsitoSeries = { ANSWERED: boolean; 'NO ANSWER': boolean; BUSY: boolean };

interface TabRicevuteProps {
  inboundDataRaw: CallData[];
  hotelNumbers: HotelNumber[];
  selectedHotelNumbers: string[];
  loadingHotels: boolean;
  handleHotelNumbersChange: (numeri: string[]) => void;
  codaDistribution: CodaDistribution[];
  conversionAnalysis: ConversionAnalysis[];
  transformCodaDistribution: (codaData: CodaDistribution[], numeriHotel: string[]) => Array<{ name: string; value: number }>;
  currentKPI: KPIMetrics | null;
  inboundTimeSeries: Array<{ date: string; count: number }>;
  showDetailedSeries: boolean;
  setShowDetailedSeries: (v: boolean) => void;
  inboundTimeSeriesDetailed: Array<{ date: string; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>;
  visibleSeries: EsitoSeries;
  setVisibleSeries: Dispatch<SetStateAction<EsitoSeries>>;
  inboundHeatmap: Array<{ ora: number; ANSWERED: number; 'NO ANSWER': number; BUSY: number }>;
  visibleHeatmapSeries: EsitoSeries;
  setVisibleHeatmapSeries: Dispatch<SetStateAction<EsitoSeries>>;
}

const ESITI = ['ANSWERED', 'NO ANSWER', 'BUSY'] as const;
const ESITO_COLORS: Record<string, string> = {
  ANSWERED: '#22c55e',
  'NO ANSWER': '#ef4444',
  BUSY: '#eab308',
};

export function TabRicevute({
  inboundDataRaw,
  hotelNumbers,
  selectedHotelNumbers,
  loadingHotels,
  handleHotelNumbersChange,
  codaDistribution,
  conversionAnalysis,
  transformCodaDistribution,
  currentKPI,
  inboundTimeSeries,
  showDetailedSeries,
  setShowDetailedSeries,
  inboundTimeSeriesDetailed,
  visibleSeries,
  setVisibleSeries,
  inboundHeatmap,
  visibleHeatmapSeries,
  setVisibleHeatmapSeries,
}: TabRicevuteProps) {
  return (
    <>
      {inboundDataRaw.length > 0 && (
        <Card className="p-6 bg-muted/30">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Filtra per Numero Hotel</h2>

            <label className="flex items-center gap-3 p-4 border-2 border-primary/50 bg-primary/5 rounded-lg cursor-pointer transition-colors hover:bg-primary/10">
              <input
                type="checkbox"
                checked={selectedHotelNumbers.length === hotelNumbers.length && hotelNumbers.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleHotelNumbersChange(hotelNumbers.map(h => h.numero_hotel));
                  } else {
                    handleHotelNumbersChange([]);
                  }
                }}
                disabled={loadingHotels}
                className="w-5 h-5 rounded border-primary cursor-pointer accent-primary"
              />
              <span className="text-sm font-bold text-foreground">
                Selezione Totale ({selectedHotelNumbers.length}/{hotelNumbers.length})
              </span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotelNumbers.map((hotel) => {
                const isSelected = selectedHotelNumbers.includes(hotel.numero_hotel);
                return (
                  <label
                    key={`${hotel.hotel_id}-${hotel.numero_hotel}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...selectedHotelNumbers, hotel.numero_hotel]
                          : selectedHotelNumbers.filter(n => n !== hotel.numero_hotel);
                        handleHotelNumbersChange(updated);
                      }}
                      disabled={loadingHotels}
                      className="w-5 h-5 rounded border-border cursor-pointer"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {hotel.hotel_nome} <span className="text-muted-foreground">({hotel.numero_hotel})</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedHotelNumbers.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Hotel selezionati ({selectedHotelNumbers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedHotelNumbers.map((numero) => {
                    const hotelName = hotelNumbers.find(h => h.numero_hotel === numero)?.hotel_nome || numero;
                    return (
                      <div
                        key={numero}
                        className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-2"
                      >
                        <span>{hotelName} ({numero})</span>
                        <button
                          onClick={() => handleHotelNumbersChange(selectedHotelNumbers.filter(n => n !== numero))}
                          className="ml-1 hover:opacity-70 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  I dati verranno aggregati come somma dei valori selezionati
                </p>
              </div>
            )}

            {selectedHotelNumbers.length > 0 && (
              <button
                onClick={() => handleHotelNumbersChange([])}
                disabled={loadingHotels}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline disabled:opacity-50"
              >
                Deseleziona tutti
              </button>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Distribuzione Code (ANSWERED)</h2>
              {codaDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={transformCodaDistribution(codaDistribution, selectedHotelNumbers)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      labelLine={false}
                    >
                      {transformCodaDistribution(codaDistribution, selectedHotelNumbers).map((entry, idx) => {
                        const colorMap: { [key: string]: string } = {
                          'Acchiappi Booking': '#8b5cf6',
                          'Acchiappi Area': '#ec4899',
                          'Risponditore Automatico': '#10b981',
                          'Risposte Area': '#f59e0b',
                          'Risposte Booking': '#3b82f6',
                        };
                        return <Cell key={`cell-${idx}`} fill={colorMap[entry.name] || '#6b7280'} />;
                      })}
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
              <h2 className="text-lg font-semibold text-foreground">Analisi Conversione</h2>
              {conversionAnalysis.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="categoria" stroke="#888" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Totale Chiamate</h3>
              <div className="text-3xl font-bold text-foreground">{currentKPI?.totaleChiamate || '--'}</div>
              <p className="text-xs text-muted-foreground">Numero totale di chiamate ricevute</p>
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
              <h3 className="text-sm font-medium text-muted-foreground">Top 3 Numeri</h3>
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
              <p className="text-xs text-muted-foreground">Numeri con più ricevute</p>
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
                    checked={showDetailedSeries}
                    onChange={(e) => setShowDetailedSeries(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-muted-foreground">Spacchetta</span>
                </label>
              </div>
              {showDetailedSeries ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={inboundTimeSeriesDetailed}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#888" />
                      <RechartsTooltip />
                      {visibleSeries.ANSWERED && (
                        <Line type="monotone" dataKey="ANSWERED" stroke="#22c55e" dot={false} isAnimationActive={false} name="ANSWERED" />
                      )}
                      {visibleSeries['NO ANSWER'] && (
                        <Line type="monotone" dataKey="NO ANSWER" stroke="#ef4444" dot={false} isAnimationActive={false} name="NO ANSWER" />
                      )}
                      {visibleSeries.BUSY && (
                        <Line type="monotone" dataKey="BUSY" stroke="#eab308" dot={false} isAnimationActive={false} name="BUSY" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 flex-wrap">
                    {ESITI.map(esito => (
                      <button
                        key={esito}
                        onClick={() => setVisibleSeries(prev => ({ ...prev, [esito]: !prev[esito] }))}
                        className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-1 rounded transition-colors ${
                          visibleSeries[esito] ? 'hover:bg-muted' : 'opacity-50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-3 h-0.5" style={{ backgroundColor: ESITO_COLORS[esito] }} />
                        <span style={{ textDecoration: !visibleSeries[esito] ? 'line-through' : 'none' }}>{esito}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={inboundTimeSeries}>
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
                  <BarChart data={inboundHeatmap} margin={{ bottom: 5, left: 0, right: 0, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="ora" stroke="#888" />
                    <YAxis stroke="#888" />
                    <RechartsTooltip />
                    {visibleHeatmapSeries.ANSWERED && <Bar dataKey="ANSWERED" stackId="a" fill="#22c55e" />}
                    {visibleHeatmapSeries['NO ANSWER'] && <Bar dataKey="NO ANSWER" stackId="a" fill="#ef4444" />}
                    {visibleHeatmapSeries.BUSY && <Bar dataKey="BUSY" stackId="a" fill="#eab308" />}
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 flex-wrap">
                  {ESITI.map(esito => (
                    <button
                      key={esito}
                      onClick={() => setVisibleHeatmapSeries(prev => ({ ...prev, [esito]: !prev[esito] }))}
                      className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-1 rounded transition-colors ${
                        visibleHeatmapSeries[esito] ? 'hover:bg-muted' : 'opacity-50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-3 h-3" style={{ backgroundColor: ESITO_COLORS[esito] }} />
                      <span style={{ textDecoration: !visibleHeatmapSeries[esito] ? 'line-through' : 'none' }}>{esito}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
