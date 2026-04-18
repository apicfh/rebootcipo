'use client';

import { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesData, StagioneTariffaria, OccupancyDataPoint, CameraTypeDataPoint, VisibleSeries } from '../types';
import { filterTimeSeriesDataByWeeks, calculateCumulativeData } from '../utils';

interface SectionGraficiProps {
  // Grafico 1: Serie Temporale
  showChart: boolean;
  setShowChart: (v: boolean) => void;
  showHistoricalSeries: boolean;
  setShowHistoricalSeries: (v: boolean) => void;
  timeSeriesData: TimeSeriesData[];
  openChartDialog: boolean;
  setOpenChartDialog: (v: boolean) => void;
  chartDialogDays: number | null;
  setChartDialogDays: (v: number | null) => void;
  isCumulativeMode: boolean;
  setIsCumulativeMode: (v: boolean) => void;
  visibleSeries: VisibleSeries;
  setVisibleSeries: Dispatch<SetStateAction<VisibleSeries>>;

  // Grafico 2: Distribuzione RN per Data Soggiorno
  showOccupancyChart: boolean;
  setShowOccupancyChart: (v: boolean) => void;
  occupancyData: OccupancyDataPoint[];
  snapshotDate: string;
  setSnapshotDate: (v: string) => void;
  visibleOccupancySeries: { anno_corrente: boolean; anno_meno_1: boolean; anno_meno_2: boolean; anno_meno_3: boolean };
  setVisibleOccupancySeries: Dispatch<SetStateAction<{ anno_corrente: boolean; anno_meno_1: boolean; anno_meno_2: boolean; anno_meno_3: boolean }>>;
  openOccupancyDialog: boolean;
  setOpenOccupancyDialog: (v: boolean) => void;

  // Grafico 3: Camera Type
  showCameraTypeChart: boolean;
  setShowCameraTypeChart: (v: boolean) => void;
  cameraTypeData: CameraTypeDataPoint[];
  cameraTypeDataFiltered: CameraTypeDataPoint[];
  cameraTypes: Array<{ id: string; nome: string }>;
  openCameraTypeDialog: boolean;
  setOpenCameraTypeDialog: (v: boolean) => void;
  visibleCameraTypes: { [key: string]: boolean };
  setVisibleCameraTypes: Dispatch<SetStateAction<{ [key: string]: boolean }>>;
  mainGraphSlot: 'main' | 0 | 1 | 2;
  setMainGraphSlot: (v: 'main' | 0 | 1 | 2) => void;
  selectedAnno: string;
  setSelectedAnno: (v: string) => void;
  selectedStagione: string;
  setSelectedStagione: (v: string) => void;
  stagioni: StagioneTariffaria[];
}

const CAMERA_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#a855f7'];

export function SectionGrafici({
  showChart, setShowChart,
  showHistoricalSeries, setShowHistoricalSeries,
  timeSeriesData,
  openChartDialog, setOpenChartDialog,
  chartDialogDays, setChartDialogDays,
  isCumulativeMode, setIsCumulativeMode,
  visibleSeries, setVisibleSeries,
  showOccupancyChart, setShowOccupancyChart,
  occupancyData,
  snapshotDate, setSnapshotDate,
  visibleOccupancySeries, setVisibleOccupancySeries,
  openOccupancyDialog, setOpenOccupancyDialog,
  showCameraTypeChart, setShowCameraTypeChart,
  cameraTypeData, cameraTypeDataFiltered,
  cameraTypes,
  openCameraTypeDialog, setOpenCameraTypeDialog,
  visibleCameraTypes, setVisibleCameraTypes,
  mainGraphSlot, setMainGraphSlot,
  selectedAnno, setSelectedAnno,
  selectedStagione, setSelectedStagione,
  stagioni,
}: SectionGraficiProps) {
  return (
    <>
      {/* SEZIONE 4 GRAFICI 2x2 — riga 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico 1: Serie Temporale Prenotazioni */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serie Temporale Prenotazioni</CardTitle>
            <CardDescription>
              Andamento prenotazioni nel tempo con confronto anno precedente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showChart ? (
              <button
                onClick={() => setShowChart(true)}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Mostra Grafico
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowChart(false)}
                    className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    Nascondi Grafico
                  </button>
                  <button
                    onClick={() => setOpenChartDialog(true)}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Espandi
                  </button>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="historical-series-toggle"
                      checked={showHistoricalSeries}
                      onCheckedChange={setShowHistoricalSeries}
                    />
                    <Label htmlFor="historical-series-toggle" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                      Mostra Storico ({showHistoricalSeries ? 'ON' : 'OFF'})
                    </Label>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Debug: {timeSeriesData.length} week points, showHistoricalSeries={String(showHistoricalSeries)}</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    key={`chart-${showHistoricalSeries}`}
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="display_date"
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(timeSeriesData.length / 6) || 0}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => value}
                      labelFormatter={(label) => `Settimana: ${label}`}
                    />
                    <Legend
                      onClick={(e) => {
                        const dataKey = e.dataKey as keyof VisibleSeries;
                        setVisibleSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
                      }}
                      wrapperStyle={{ cursor: 'pointer' }}
                      formatter={(value, entry) => {
                        const isVisible = visibleSeries[entry.dataKey as keyof VisibleSeries];
                        return <span style={{ textDecoration: isVisible ? 'none' : 'line-through', opacity: isVisible ? 1 : 0.5 }}>{value}</span>;
                      }}
                    />
                    <Line type="monotone" dataKey="anno_corrente" stroke="#10b981" name="Anno Corrente" dot={false} strokeWidth={2} strokeOpacity={visibleSeries.anno_corrente ? 1 : 0} />
                    <Line type="monotone" dataKey="anno_meno_1" stroke="#f59e0b" name="1 Anno Fa" dot={false} strokeWidth={2} strokeOpacity={visibleSeries.anno_meno_1 ? (showHistoricalSeries ? 1 : 0) : 0} />
                    <Line type="monotone" dataKey="anno_meno_2" stroke="#ef4444" name="2 Anni Fa" dot={false} strokeWidth={2} strokeOpacity={visibleSeries.anno_meno_2 ? (showHistoricalSeries ? 1 : 0) : 0} />
                    <Line type="monotone" dataKey="anno_meno_3" stroke="#8b5cf6" name="3 Anni Fa" dot={false} strokeWidth={2} strokeOpacity={visibleSeries.anno_meno_3 ? (showHistoricalSeries ? 1 : 0) : 0} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafico 2: Distribuzione RN per Data Soggiorno */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione RN per Data Soggiorno</CardTitle>
            <CardDescription>
              Mappa termica delle camere occupate per data soggiorno
            </CardDescription>
          </CardHeader>
          {!showOccupancyChart ? (
            <CardContent>
              <button
                onClick={() => setShowOccupancyChart(true)}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Mostra Grafico
              </button>
            </CardContent>
          ) : (
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowOccupancyChart(false)}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Nascondi Grafico
                </button>
                <Button variant="outline" onClick={() => setOpenOccupancyDialog(true)} size="sm">
                  Espandi
                </Button>
              </div>
              <Label htmlFor="snapshot-date" className="whitespace-nowrap">Snapshot Data:</Label>
              <input
                id="snapshot-date"
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm"
              />
              {snapshotDate && (
                <Button variant="ghost" size="sm" onClick={() => setSnapshotDate('')}>
                  Cancella
                </Button>
              )}
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="display_date"
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(occupancyData.length / 12) || 0}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {visibleOccupancySeries.anno_corrente && <Bar dataKey="anno_corrente" fill="#10b981" name="Anno Corrente" />}
                    {visibleOccupancySeries.anno_meno_1 && <Bar dataKey="anno_meno_1" fill="#f59e0b" name="1 Anno Fa" />}
                    {visibleOccupancySeries.anno_meno_2 && <Bar dataKey="anno_meno_2" fill="#ef4444" name="2 Anni Fa" />}
                    {visibleOccupancySeries.anno_meno_3 && <Bar dataKey="anno_meno_3" fill="#8b5cf6" name="3 Anni Fa" />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* SEZIONE 4 GRAFICI 2x2 — riga 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grafico 3: Serie Temporale per Tipologia Camera */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Prenotazioni per Tipologia Camera</CardTitle>
              <CardDescription>
                Serie temporale spacchettata per tipo di camera disponibile
              </CardDescription>
            </div>
          </CardHeader>
          {!showCameraTypeChart ? (
            <CardContent>
              <button
                onClick={() => setShowCameraTypeChart(true)}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Mostra Grafico
              </button>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setShowCameraTypeChart(false)}
                    className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    Nascondi Grafico
                  </button>
                  <select
                    value={selectedAnno}
                    onChange={(e) => {
                      setSelectedAnno(e.target.value);
                      setSelectedStagione('');
                    }}
                    className="px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-muted transition-colors"
                  >
                    <option value="">Tutti gli anni</option>
                    {Array.from(new Set(stagioni.map(s => s.anno)))
                      .sort((a, b) => b - a)
                      .map((anno) => (
                        <option key={anno} value={anno.toString()}>{anno}</option>
                      ))}
                  </select>
                  <select
                    value={selectedStagione}
                    onChange={(e) => setSelectedStagione(e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-muted transition-colors"
                  >
                    <option value="">Tutte le stagioni</option>
                    {stagioni
                      .filter(stagione => !selectedAnno || stagione.anno.toString() === selectedAnno)
                      .map((stagione) => (
                        <option key={stagione.id} value={stagione.id}>{stagione.nome}</option>
                      ))}
                  </select>
                  <Button variant="outline" onClick={() => setOpenCameraTypeDialog(true)} size="sm">
                    Espandi
                  </Button>
                </div>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cameraTypeDataFiltered}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="display_date"
                        tick={{ fontSize: 12 }}
                        interval={Math.floor(cameraTypeData.length / 8) || 0}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend
                        onClick={(e) => {
                          const cameraType = e.dataKey as string;
                          setVisibleCameraTypes(prev => ({ ...prev, [cameraType]: !prev[cameraType] }));
                        }}
                        wrapperStyle={{ cursor: 'pointer' }}
                        formatter={(value, entry) => {
                          const isVisible = visibleCameraTypes[entry.dataKey as string];
                          return <span style={{ textDecoration: isVisible ? 'none' : 'line-through', opacity: isVisible ? 1 : 0.5 }}>{value}</span>;
                        }}
                      />
                      {cameraTypes.map((camera, idx) => (
                        <Line
                          key={camera.id}
                          type="monotone"
                          dataKey={camera.id}
                          stroke={CAMERA_COLORS[idx % CAMERA_COLORS.length]}
                          name={camera.nome}
                          dot={false}
                          strokeWidth={2}
                          strokeOpacity={visibleCameraTypes[camera.id] ? 1 : 0}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Grafico 4: Curva Prezzi Attuale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Curva Prezzi Attuale</CardTitle>
            <CardDescription>
              Andamento prezzi ADR nel periodo selezionato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-md flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Placeholder Grafico 4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Serie Temporale Dettagliata */}
      <Dialog open={openChartDialog} onOpenChange={setOpenChartDialog}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Serie Temporale - Dettagliata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex gap-2 flex-wrap">
                <Button variant={chartDialogDays === null ? 'default' : 'outline'} onClick={() => setChartDialogDays(null)} size="sm">Tutto</Button>
                <Button variant={chartDialogDays === 4 ? 'default' : 'outline'} onClick={() => setChartDialogDays(4)} size="sm">4 sett</Button>
                <Button variant={chartDialogDays === 8 ? 'default' : 'outline'} onClick={() => setChartDialogDays(8)} size="sm">8 sett</Button>
                <Button variant={chartDialogDays === 12 ? 'default' : 'outline'} onClick={() => setChartDialogDays(12)} size="sm">12 sett</Button>
              </div>
              <div className="flex-1" />
              <Button
                variant={isCumulativeMode ? 'default' : 'outline'}
                onClick={() => setIsCumulativeMode(!isCumulativeMode)}
                size="sm"
              >
                Cumulativo
              </Button>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-historical" className="text-sm whitespace-nowrap">Mostra Storico</Label>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition ${showHistoricalSeries ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => setShowHistoricalSeries(!showHistoricalSeries)}
                  id="show-historical"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${showHistoricalSeries ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>
            <div className="w-full h-[70vh]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={isCumulativeMode ? calculateCumulativeData(filterTimeSeriesDataByWeeks(timeSeriesData, chartDialogDays)) : filterTimeSeriesDataByWeeks(timeSeriesData, chartDialogDays)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display_date" />
                  <YAxis />
                  <Tooltip />
                  <Legend
                    onClick={(e) => {
                      const dataKey = e.dataKey as keyof VisibleSeries;
                      setVisibleSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
                    }}
                    wrapperStyle={{ cursor: 'pointer' }}
                    formatter={(value, entry) => {
                      const isVisible = visibleSeries[entry.dataKey as keyof VisibleSeries];
                      return <span style={{ textDecoration: isVisible ? 'none' : 'line-through', opacity: isVisible ? 1 : 0.5 }}>{value}</span>;
                    }}
                  />
                  {visibleSeries.anno_corrente && <Line type="monotone" dataKey="anno_corrente" stroke="#10b981" name="Anno Corrente" strokeOpacity={1} />}
                  {visibleSeries.anno_meno_1 && <Line type="monotone" dataKey="anno_meno_1" stroke="#f59e0b" name="1 Anno Fa" strokeOpacity={showHistoricalSeries ? 1 : 0} />}
                  {visibleSeries.anno_meno_2 && <Line type="monotone" dataKey="anno_meno_2" stroke="#ef4444" name="2 Anni Fa" strokeOpacity={showHistoricalSeries ? 1 : 0} />}
                  {visibleSeries.anno_meno_3 && <Line type="monotone" dataKey="anno_meno_3" stroke="#8b5cf6" name="3 Anni Fa" strokeOpacity={showHistoricalSeries ? 1 : 0} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Distribuzione RN per Data Soggiorno */}
      <Dialog open={openOccupancyDialog} onOpenChange={setOpenOccupancyDialog}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Distribuzione RN per Data Soggiorno - Dettagliata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              <Label htmlFor="snapshot-date-dialog" className="whitespace-nowrap">Snapshot Data:</Label>
              <input
                id="snapshot-date-dialog"
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm"
              />
              {snapshotDate && (
                <Button variant="ghost" size="sm" onClick={() => setSnapshotDate('')}>
                  Cancella
                </Button>
              )}
            </div>
            <div className="w-full h-[70vh]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="display_date"
                    tick={{ fontSize: 12 }}
                    interval={Math.floor(occupancyData.length / 12) || 0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend
                    onClick={(e) => {
                      const dataKey = e.dataKey as keyof typeof visibleOccupancySeries;
                      setVisibleOccupancySeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
                    }}
                  />
                  {visibleOccupancySeries.anno_corrente && <Bar dataKey="anno_corrente" fill="#10b981" name="Anno Corrente" />}
                  {visibleOccupancySeries.anno_meno_1 && <Bar dataKey="anno_meno_1" fill="#f59e0b" name="1 Anno Fa" />}
                  {visibleOccupancySeries.anno_meno_2 && <Bar dataKey="anno_meno_2" fill="#ef4444" name="2 Anni Fa" />}
                  {visibleOccupancySeries.anno_meno_3 && <Bar dataKey="anno_meno_3" fill="#8b5cf6" name="3 Anni Fa" />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Prenotazioni per Tipologia Camera */}
      <Dialog open={openCameraTypeDialog} onOpenChange={setOpenCameraTypeDialog}>
        <DialogContent className="max-w-[90vw] h-[90vh]">
          <DialogHeader className="flex-col gap-3">
            <DialogTitle>Prenotazioni per Tipologia Camera - Dettagliata</DialogTitle>
            <div className="flex gap-3 items-center">
              <select
                value={selectedAnno}
                onChange={(e) => {
                  setSelectedAnno(e.target.value);
                  setSelectedStagione('');
                }}
                className="px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-muted transition-colors"
              >
                <option value="">Tutti gli anni</option>
                {Array.from(new Set(stagioni.map(s => s.anno)))
                  .sort((a, b) => b - a)
                  .map((anno) => (
                    <option key={anno} value={anno.toString()}>{anno}</option>
                  ))}
              </select>
              <select
                value={selectedStagione}
                onChange={(e) => setSelectedStagione(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-muted transition-colors"
              >
                <option value="">Tutte le stagioni</option>
                {stagioni
                  .filter(stagione => !selectedAnno || stagione.anno.toString() === selectedAnno)
                  .map((stagione) => (
                    <option key={stagione.id} value={stagione.id}>{stagione.nome}</option>
                  ))}
              </select>
            </div>
          </DialogHeader>
          <div className="flex gap-4 h-full">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cameraTypeDataFiltered}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="display_date"
                    tick={{ fontSize: 11 }}
                    interval={Math.floor(cameraTypeData.length / 10) || 0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend
                    onClick={(e) => {
                      const cameraType = e.dataKey as string;
                      setVisibleCameraTypes(prev => ({ ...prev, [cameraType]: !prev[cameraType] }));
                    }}
                    wrapperStyle={{ cursor: 'pointer' }}
                    formatter={(value, entry) => {
                      const isVisible = visibleCameraTypes[entry.dataKey as string];
                      return <span style={{ textDecoration: isVisible ? 'none' : 'line-through', opacity: isVisible ? 1 : 0.5 }}>{value}</span>;
                    }}
                  />
                  {mainGraphSlot === 'main' ? (
                    cameraTypes.map((camera, idx) => (
                      <Line
                        key={camera.id}
                        type="monotone"
                        dataKey={camera.id}
                        stroke={CAMERA_COLORS[idx % CAMERA_COLORS.length]}
                        name={camera.nome}
                        dot={false}
                        strokeWidth={2}
                        strokeOpacity={visibleCameraTypes[camera.id] ? 1 : 0}
                      />
                    ))
                  ) : (
                    <Line type="monotone" dataKey="" stroke="#000" name="Placeholder" dot={false} strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 w-80">
              {[0, 1, 2].map((slotIdx) => {
                const isCurrentMain = mainGraphSlot === slotIdx;
                return (
                  <div
                    key={slotIdx}
                    onClick={() => setMainGraphSlot(isCurrentMain ? 'main' : slotIdx as 0 | 1 | 2)}
                    className={`h-1/3 border rounded-md p-2 flex items-center justify-center cursor-pointer transition-all ${
                      isCurrentMain
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted hover:bg-muted/80'
                    }`}
                    title="Clicca per scambiare con il grafico principale"
                  >
                    <span className="text-xs text-muted-foreground">
                      {isCurrentMain ? '(Principale)' : `Placeholder Grafico ${slotIdx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
