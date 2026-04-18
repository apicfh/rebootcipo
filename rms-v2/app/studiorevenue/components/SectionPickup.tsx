'use client';

import { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PickupDataPoint } from '../types';

interface SectionPickupProps {
  selectedHotel: string;
  pickupDateFrom: string;
  setPickupDateFrom: (v: string) => void;
  pickupDateTo: string;
  setPickupDateTo: (v: string) => void;
  pickupSelectedTipologie: string[];
  setPickupSelectedTipologie: Dispatch<SetStateAction<string[]>>;
  pickupAggrega: boolean;
  setPickupAggrega: (v: boolean) => void;
  pickupCrescitaGiorni: number;
  setPickupCrescitaGiorni: (v: number) => void;
  pickupLoading: boolean;
  pickupOccupancyData: PickupDataPoint[];
  pickupTipologieDisponibili: Array<{ nome: string; quantita: number }>;
  showPickupChart: boolean;
  pickupDropdownOpen: boolean;
  setPickupDropdownOpen: (v: boolean) => void;
  pickupCoefficiente: number;
  setPickupCoefficiente: (v: number) => void;
  calcolaPickup: () => Promise<void>;
}

export function SectionPickup({
  selectedHotel,
  pickupDateFrom, setPickupDateFrom,
  pickupDateTo, setPickupDateTo,
  pickupSelectedTipologie, setPickupSelectedTipologie,
  pickupAggrega, setPickupAggrega,
  pickupCrescitaGiorni, setPickupCrescitaGiorni,
  pickupLoading,
  pickupOccupancyData,
  pickupTipologieDisponibili,
  showPickupChart,
  pickupDropdownOpen, setPickupDropdownOpen,
  pickupCoefficiente, setPickupCoefficiente,
  calcolaPickup,
}: SectionPickupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Andamento Pick-Up</CardTitle>
        <CardDescription>
          Analisi velocita di vendita per tipologia camera e proiezione occupazione attesa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Riga filtri */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-sm font-medium text-foreground block mb-2">Data Inizio Soggiorno</label>
            <input
              type="date"
              value={pickupDateFrom}
              onChange={(e) => setPickupDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-sm font-medium text-foreground block mb-2">Data Fine Soggiorno</label>
            <input
              type="date"
              value={pickupDateTo}
              onChange={(e) => setPickupDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            />
          </div>

          {/* Multi-select Tipologie Camera */}
          <div className="flex-1 min-w-[200px] relative">
            <label className="text-sm font-medium text-foreground block mb-2">Tipologie Camera</label>
            <button
              onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm text-left"
            >
              {pickupSelectedTipologie.length === 0
                ? 'Seleziona tipologie...'
                : `${pickupSelectedTipologie.length} tipolog${pickupSelectedTipologie.length === 1 ? 'ia' : 'ie'} selezionat${pickupSelectedTipologie.length === 1 ? 'a' : 'e'}`}
            </button>
            {pickupDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                <button
                  onClick={() => {
                    if (pickupSelectedTipologie.length === pickupTipologieDisponibili.length) {
                      setPickupSelectedTipologie([]);
                    } else {
                      setPickupSelectedTipologie(pickupTipologieDisponibili.map(t => t.nome));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted border-b border-border font-medium"
                >
                  {pickupSelectedTipologie.length === pickupTipologieDisponibili.length ? 'Deseleziona tutto' : 'Seleziona tutto'}
                </button>
                {pickupTipologieDisponibili.map(tipologia => (
                  <label
                    key={tipologia.nome}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={pickupSelectedTipologie.includes(tipologia.nome)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPickupSelectedTipologie(prev => [...prev, tipologia.nome]);
                        } else {
                          setPickupSelectedTipologie(prev => prev.filter(t => t !== tipologia.nome));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>{tipologia.nome}</span>
                    <span className="text-muted-foreground ml-auto">({tipologia.quantita})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <label className="text-sm font-medium text-foreground">Aggrega</label>
            <Switch checked={pickupAggrega} onCheckedChange={setPickupAggrega} />
          </div>

          <div className="min-w-[140px]">
            <label className="text-sm font-medium text-foreground block mb-2">Crescita</label>
            <Select value={String(pickupCrescitaGiorni)} onValueChange={(v) => setPickupCrescitaGiorni(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">Ultimi 14 gg</SelectItem>
                <SelectItem value="30">Ultimi 30 gg</SelectItem>
                <SelectItem value="90">Ultimi 90 gg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={calcolaPickup}
            disabled={!selectedHotel || !pickupDateFrom || !pickupDateTo || pickupSelectedTipologie.length === 0 || pickupLoading}
            className="h-10"
          >
            {pickupLoading ? 'Caricamento...' : 'Mostra Grafico'}
          </Button>
        </div>

        {/* Chips tipologie selezionate */}
        {pickupSelectedTipologie.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pickupSelectedTipologie.map(tipologia => (
              <span
                key={tipologia}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tipologia}
                <button
                  onClick={() => setPickupSelectedTipologie(prev => prev.filter(t => t !== tipologia))}
                  className="hover:text-destructive"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Slider coefficiente correttivo */}
        {showPickupChart && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">Scenario:</label>
            <input
              type="range"
              min={-50}
              max={50}
              step={5}
              value={pickupCoefficiente}
              onChange={(e) => {
                setPickupCoefficiente(Number(e.target.value));
                calcolaPickup();
              }}
              className="flex-1"
            />
            <span className={`text-sm font-medium min-w-[60px] text-right ${
              pickupCoefficiente > 0 ? 'text-green-600' : pickupCoefficiente < 0 ? 'text-red-600' : 'text-muted-foreground'
            }`}>
              {pickupCoefficiente > 0 ? '+' : ''}{pickupCoefficiente}%
            </span>
          </div>
        )}

        {/* Area grafico */}
        {showPickupChart ? (
          <div className="space-y-2">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>Camere totali: <strong className="text-foreground">{pickupOccupancyData[0]?.totali ?? 0}</strong></span>
              <span>Occupate oggi: <strong className="text-foreground">{pickupOccupancyData[0]?.occupate ?? 0}</strong> ({pickupOccupancyData[0]?.percentuale_attuale ?? 0}%)</span>
              <span>Proiezione fine periodo: <strong className="text-foreground">{pickupOccupancyData[pickupOccupancyData.length - 1]?.proiezione ?? 0}</strong> ({pickupOccupancyData[pickupOccupancyData.length - 1]?.percentuale_proiezione ?? 0}%)</span>
              {pickupOccupancyData[pickupOccupancyData.length - 1]?.storico !== null && (
                <span>Anno scorso fine periodo: <strong className="text-foreground">{pickupOccupancyData[pickupOccupancyData.length - 1]?.storico ?? 0}</strong></span>
              )}
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pickupOccupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display_date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, pickupOccupancyData[0]?.totali ?? 'auto']} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const totali = pickupOccupancyData[0]?.totali ?? 1;
                      const pct = Math.round((value / totali) * 100);
                      return [`${value} (${pct}%)`, name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="occupate" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} name="Occupazione attuale" />
                  <Line type="monotone" dataKey="proiezione" stroke="#f97316" strokeWidth={2} strokeDasharray="8 4" dot={false} isAnimationActive={false} name="Proiezione" />
                  <Line type="monotone" dataKey="totali" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} name="Capacita max" />
                  <Line type="monotone" dataKey="storico" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} name="Anno precedente" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-72 bg-muted rounded-md flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              {!selectedHotel ? 'Seleziona un hotel per iniziare' : 'Compila i filtri e clicca "Mostra Grafico"'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
