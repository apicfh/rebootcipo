'use client';

import { Card } from '@/components/ui/card';
import type { ConversioniAgentiStats, SortColumn, SortDir, CriterioAttribuzione } from '../types';

interface TabConversioniProps {
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  selectedHotel: string;
  setSelectedHotel: (id: string) => void;
  hotelList: Array<{ id: string; nome: string }>;
  conversioniPrenotazioniKPI: { totale_prenotazioni: number; totale_fatturato: number; totale_notti: number } | null;
  criterioAttribuzione: CriterioAttribuzione;
  setCriterioAttribuzione: (v: CriterioAttribuzione) => void;
  handleConversioniRicerca: () => void;
  loadingConversioni: boolean;
  conversioniAgentiStats: ConversioniAgentiStats[];
  sortColumn: SortColumn;
  sortDirection: SortDir;
  handleSort: (column: 'chiamate' | 'prenotazioni' | 'tasso') => void;
  getSortedStats: () => ConversioniAgentiStats[];
  handleShowDetails: (agente: any) => void;
  conversioniPrenotazioniNoContact: number;
  selectedPrenotazioneDetails: any;
  showDetailsDialog: boolean;
  setShowDetailsDialog: (v: boolean) => void;
}

export function TabConversioni({
  dateRange,
  setDateRange,
  selectedHotel,
  setSelectedHotel,
  hotelList,
  conversioniPrenotazioniKPI,
  criterioAttribuzione,
  setCriterioAttribuzione,
  handleConversioniRicerca,
  loadingConversioni,
  conversioniAgentiStats,
  sortColumn,
  sortDirection,
  handleSort,
  getSortedStats,
  handleShowDetails,
  conversioniPrenotazioniNoContact,
  selectedPrenotazioneDetails,
  showDetailsDialog,
  setShowDetailsDialog,
}: TabConversioniProps) {
  return (
    <>
      <div className="space-y-6">
        <Card className="p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Inizio</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Fine</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-muted/30">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Filtra per Hotel</h2>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
            >
              <option value="">-- Globale (tutti gli hotel) --</option>
              {hotelList.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.nome}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Prenotazioni</p>
              <p className="text-3xl font-bold text-primary">{conversioniPrenotazioniKPI?.totale_prenotazioni || 0}</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Fatturato</p>
              <p className="text-3xl font-bold text-green-600">€ {(conversioniPrenotazioniKPI?.totale_fatturato || 0).toFixed(2)}</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">Notti</p>
              <p className="text-3xl font-bold text-blue-600">{conversioniPrenotazioniKPI?.totale_notti || 0}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Criterio di Attribuzione</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="criterio"
                  value="primo-contatto"
                  checked={criterioAttribuzione === 'primo-contatto'}
                  onChange={(e) => setCriterioAttribuzione(e.target.value as CriterioAttribuzione)}
                  className="w-4 h-4"
                />
                <span className="text-foreground">Primo Contatto</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="criterio"
                  value="durata-massima"
                  checked={criterioAttribuzione === 'durata-massima'}
                  onChange={(e) => setCriterioAttribuzione(e.target.value as CriterioAttribuzione)}
                  className="w-4 h-4"
                />
                <span className="text-foreground">Durata Massima</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="criterio"
                  value="ogni-contatto"
                  checked={criterioAttribuzione === 'ogni-contatto'}
                  onChange={(e) => setCriterioAttribuzione(e.target.value as CriterioAttribuzione)}
                  className="w-4 h-4"
                />
                <span className="text-foreground">Ogni Contatto</span>
              </label>
            </div>
            <button
              onClick={handleConversioniRicerca}
              disabled={loadingConversioni || !dateRange.from || !dateRange.to}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {loadingConversioni ? 'Ricerca in corso...' : 'Ricerca'}
            </button>
          </div>
        </Card>

        {conversioniAgentiStats.length > 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Statistiche Agenti</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Agente</th>
                      <th
                        className="text-right py-3 px-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('chiamate')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Chiamate Totali
                          {sortColumn === 'chiamate' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Prenotazioni Convertite</th>
                      <th
                        className="text-right py-3 px-4 font-medium cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('tasso')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Tasso di Conversione
                          {sortColumn === 'tasso' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Fatturato Generato</th>
                      <th className="text-right py-3 px-4 font-medium">Tempo Medio Cottura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedStats().map((agente, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">{agente.agente_nome}</td>
                        <td className="py-3 px-4 text-right text-foreground">{agente.totale_chiamate_agente}</td>
                        <td
                          className="py-3 px-4 text-right text-blue-600 font-medium cursor-pointer hover:underline"
                          onClick={() => handleShowDetails(agente)}
                        >
                          {agente.prenotazioni_convertite}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground font-medium">{agente.tasso_conversione.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right text-foreground">€ {agente.fatturato_generato.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-foreground">{agente.giorni_media_cottura.toFixed(1)} gg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {conversioniAgentiStats.length > 0 && conversioniPrenotazioniNoContact > 0 && (
          <Card className="p-6 bg-orange-50 border border-orange-200">
            <div className="space-y-2">
              <p className="text-xs text-orange-600 font-medium uppercase">Prenotazioni Senza Contatti</p>
              <p className="text-3xl font-bold text-orange-600">{conversioniPrenotazioniNoContact}</p>
              <p className="text-xs text-orange-600 text-muted-foreground">Prenotazioni senza cliente_telefono né cliente_cellulare</p>
            </div>
          </Card>
        )}
      </div>

      {showDetailsDialog && selectedPrenotazioneDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Dettagli - {selectedPrenotazioneDetails.agente_nome}</h2>
                <button
                  onClick={() => setShowDetailsDialog(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Chiamate Totali</p>
                  <p className="text-lg font-bold text-foreground">{selectedPrenotazioneDetails.totale_chiamate_agente}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Prenotazioni</p>
                  <p className="text-lg font-bold text-foreground">{selectedPrenotazioneDetails.prenotazioni_convertite}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tasso Conversione</p>
                  <p className="text-lg font-bold text-foreground">{selectedPrenotazioneDetails.tasso_conversione.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Fatturato</p>
                  <p className="text-lg font-bold text-foreground">€ {selectedPrenotazioneDetails.fatturato_generato.toFixed(2)}</p>
                </div>
              </div>

              {selectedPrenotazioneDetails.prenotazioni_details && selectedPrenotazioneDetails.prenotazioni_details.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Prenotazioni Convertite ({selectedPrenotazioneDetails.prenotazioni_details.length})</h3>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="text-left py-2 px-3">Data Telefonata</th>
                          <th className="text-left py-2 px-3">Email Cliente</th>
                          <th className="text-left py-2 px-3">Tipo Camera</th>
                          <th className="text-left py-2 px-3">Data Prenotazione</th>
                          <th className="text-right py-2 px-3">Fatturato</th>
                          <th className="text-right py-2 px-3">Notti</th>
                          <th className="text-right py-2 px-3">Giorni da Chiamata</th>
                          <th className="text-right py-2 px-3">Durata Chiamata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrenotazioneDetails.prenotazioni_details.map((prenotazione: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-2 px-3 text-muted-foreground">{new Date(prenotazione.data_telefonata).toLocaleDateString('it-IT')} {new Date(prenotazione.data_telefonata).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-2 px-3 text-muted-foreground">{prenotazione.cliente_email || '-'}</td>
                            <td className="py-2 px-3 text-muted-foreground">{prenotazione.tipo_camera || '-'}</td>
                            <td className="py-2 px-3">{new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT')}</td>
                            <td className="text-right py-2 px-3">€ {prenotazione.totale_soggiorno.toFixed(2)}</td>
                            <td className="text-right py-2 px-3">{prenotazione.notti}</td>
                            <td className="text-right py-2 px-3">{prenotazione.giorni_differenza} gg</td>
                            <td className="text-right py-2 px-3">{prenotazione.durata_secondi}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDetailsDialog(false)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Chiudi
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
