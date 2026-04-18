"use client"

import { useMemo, useState } from "react"
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { DatiAnalisiPrezzo, FiltroSelezionato } from "@/lib/services/analisi-prezzo-service"
import { format, parseISO, addDays, startOfWeek, addWeeks } from "date-fns"
import { it } from "date-fns/locale"
import { COLORI_SET } from "@/lib/services/analisi-prezzo-service"

interface Props {
  datiSets: Record<string, DatiAnalisiPrezzo>
  filtriSelezionati: FiltroSelezionato[]
  includiStato8: boolean
  onIncludiStato8Change: (value: boolean) => void
}

export function GraficoAnalisiPrezzoV2({ datiSets, filtriSelezionati, includiStato8, onIncludiStato8Change }: Props) {
  const [visualizzazioneCumulativa, setVisualizzazioneCumulativa] = useState(false)
  const [granularitaSettimanale, setGranularitaSettimanale] = useState(false)

  const datiGrafico = useMemo(() => {
    if (!datiSets || Object.keys(datiSets).length === 0) return []

    // Determina il range temporale dai dati
    let rangeInizio: Date | null = null
    let rangeFine: Date | null = null

    Object.values(datiSets).forEach((dati) => {
      if (dati.range_temporale?.inizio) {
        const inizio = parseISO(dati.range_temporale.inizio)
        if (!rangeInizio || inizio < rangeInizio) {
          rangeInizio = inizio
        }
      }
      if (dati.range_temporale?.fine) {
        const fine = parseISO(dati.range_temporale.fine)
        if (!rangeFine || fine > rangeFine) {
          rangeFine = fine
        }
      }
    })

    if (!rangeInizio || !rangeFine) return []

    // Genera tutte le date nel range (giornaliere o settimanali)
    const tutteLePeriodi: string[] = []
    let dataCorrente = rangeInizio

    if (granularitaSettimanale) {
      // Settimanale: inizia dal lunedì della settimana
      dataCorrente = startOfWeek(rangeInizio, { weekStartsOn: 1 })
      while (dataCorrente <= rangeFine) {
        tutteLePeriodi.push(format(dataCorrente, "yyyy-MM-dd"))
        dataCorrente = addWeeks(dataCorrente, 1)
      }
    } else {
      // Giornaliero
      while (dataCorrente <= rangeFine) {
        tutteLePeriodi.push(format(dataCorrente, "yyyy-MM-dd"))
        dataCorrente = addDays(dataCorrente, 1)
      }
    }

    // Crea i dati del grafico
    const datiBase = tutteLePeriodi.map((periodo) => {
      const punto: any = { data: periodo }

      Object.entries(datiSets).forEach(([id, dati], index) => {
        const filtro = filtriSelezionati.find((f) => f.id === id)
        if (!filtro) return

        // Trova il prezzo valido per questo periodo
        const prezzoValido = dati.prezzi?.find(
          (p) => p.valido_da <= periodo && (p.valido_a >= periodo || p.valido_a === null),
        )

        if (prezzoValido) {
          punto[`prezzo_${index}`] = Number(prezzoValido.prezzo)
        }

        // Conta le prenotazioni per questo periodo
        let conteggioPrenotazioni = 0

        if (granularitaSettimanale) {
          // Settimanale: conta prenotazioni nella settimana
          const inizioSettimana = parseISO(periodo)
          const fineSettimana = addDays(inizioSettimana, 6)

          conteggioPrenotazioni =
            dati.prenotazioni?.filter((p) => {
              if (!p.data_prenotazione) return false
              const dataPrenotazione = parseISO(p.data_prenotazione)
              return dataPrenotazione >= inizioSettimana && dataPrenotazione <= fineSettimana
            }).length || 0
        } else {
          // Giornaliero: conta prenotazioni del giorno
          conteggioPrenotazioni =
            dati.prenotazioni?.filter((p) => {
              if (!p.data_prenotazione) return false
              return p.data_prenotazione.startsWith(periodo)
            }).length || 0
        }

        if (conteggioPrenotazioni > 0) {
          punto[`prenotazioni_${index}`] = conteggioPrenotazioni
        }
      })

      return punto
    })

    // Se visualizzazione cumulativa, calcola i valori cumulativi per le prenotazioni
    if (visualizzazioneCumulativa) {
      const cumulativi: Record<string, number> = {}

      // Inizializza i contatori cumulativi per ogni filtro
      filtriSelezionati.forEach((_, index) => {
        cumulativi[`prenotazioni_${index}`] = 0
      })

      return datiBase.map((punto) => {
        const puntoCumulativo = { ...punto }

        // Aggiorna e applica i valori cumulativi per le prenotazioni
        filtriSelezionati.forEach((_, index) => {
          const chiavePrenotazioni = `prenotazioni_${index}`
          if (punto[chiavePrenotazioni] !== undefined && punto[chiavePrenotazioni] !== null) {
            cumulativi[chiavePrenotazioni] += punto[chiavePrenotazioni]
          }
          puntoCumulativo[chiavePrenotazioni] = cumulativi[chiavePrenotazioni]
        })

        return puntoCumulativo
      })
    }

    return datiBase
  }, [datiSets, filtriSelezionati, visualizzazioneCumulativa, granularitaSettimanale])

  const hasPrezzi = useMemo(() => {
    return datiGrafico.some((punto) =>
      Object.keys(punto).some(
        (chiave) =>
          chiave.startsWith("prezzo_") && punto[chiave] !== undefined && punto[chiave] !== null && punto[chiave] > 0,
      ),
    )
  }, [datiGrafico])

  const hasPrenotazioni = useMemo(() => {
    return datiGrafico.some((punto) =>
      Object.keys(punto).some(
        (chiave) =>
          chiave.startsWith("prenotazioni_") &&
          punto[chiave] !== undefined &&
          punto[chiave] !== null &&
          punto[chiave] > 0,
      ),
    )
  }, [datiGrafico])

  const formatTooltip = (value: any, name: string) => {
    const serieIndex = name.match(/_(\d+)$/)?.[1]
    const filtro = serieIndex ? filtriSelezionati[Number.parseInt(serieIndex)] : null

    if (name.startsWith("prezzo_")) {
      const anno = filtro?.stagione?.match(/\d{4}/)?.[0] || "N/A"
      return [`€${Number(value).toFixed(2)}`, `Prezzo (${anno})`]
    }
    if (name.startsWith("prenotazioni_")) {
      const tipoVisualizzazione = visualizzazioneCumulativa ? "Prenotazioni Cumulative" : "Prenotazioni"
      const anno = filtro?.stagione?.match(/\d{4}/)?.[0] || "N/A"
      return [`${value} prenotazioni`, `${tipoVisualizzazione} (${anno})`]
    }
    return [value, name]
  }

  const formatXAxisLabel = (tickItem: string) => {
    try {
      if (granularitaSettimanale) {
        return format(parseISO(tickItem), "dd/MM", { locale: it })
      } else {
        return format(parseISO(tickItem), "dd/MM", { locale: it })
      }
    } catch {
      return tickItem
    }
  }

  if (!datiSets || Object.keys(datiSets).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analisi Prezzi</CardTitle>
          <CardDescription>Seleziona almeno un filtro per visualizzare i dati</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controlli */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="cumulativo"
                checked={visualizzazioneCumulativa}
                onCheckedChange={setVisualizzazioneCumulativa}
              />
              <Label htmlFor="cumulativo">Cumulativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="granularita" checked={granularitaSettimanale} onCheckedChange={setGranularitaSettimanale} />
              <Label htmlFor="granularita">Settimanale</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="stato8" checked={includiStato8} onCheckedChange={onIncludiStato8Change} />
              <Label htmlFor="stato8">Includi Stato "8"</Label>
            </div>

            <div className="text-sm text-muted-foreground">
              {datiGrafico.length} punti dati ({granularitaSettimanale ? "settimanali" : "giornalieri"})
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            <div>Modalità: {visualizzazioneCumulativa ? "Cumulativa" : "Distribuzione"}</div>
            <div>Granularità: {granularitaSettimanale ? "Settimanale" : "Giornaliera"}</div>
            <div>Stato "8": {includiStato8 ? "Incluso" : "Escluso"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Andamento Prezzi e Prenotazioni</CardTitle>
          <CardDescription>
            Prezzi (asse sinistro) e prenotazioni{" "}
            {visualizzazioneCumulativa ? "cumulative" : granularitaSettimanale ? "settimanali" : "giornaliere"} (asse
            destro)
            {(() => {
              const anniUnici = new Set()
              filtriSelezionati.forEach((filtro) => {
                // Estrai l'anno dalla settimana o dalla stagione
                if (filtro.stagione) {
                  const anno = filtro.stagione.match(/\d{4}/)?.[0]
                  if (anno) anniUnici.add(anno)
                }
              })

              return anniUnici.size > 1 ? (
                <span className="text-amber-600 font-medium">
                  {" "}
                  • Confronto multi-anno ({Array.from(anniUnici).sort().join(", ")})
                </span>
              ) : null
            })()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datiGrafico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun dato disponibile per i filtri selezionati
            </div>
          ) : !hasPrezzi && !hasPrenotazioni ? (
            <div className="text-center py-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Nessun dato disponibile</div>
              <div className="text-sm text-muted-foreground">
                Non sono stati trovati prezzi o prenotazioni per la combinazione selezionata
              </div>
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={datiGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" tickFormatter={formatXAxisLabel} interval="preserveStartEnd" />
                  <YAxis
                    yAxisId="prezzo"
                    orientation="left"
                    label={{ value: "Prezzo (€)", angle: -90, position: "insideLeft" }}
                  />
                  <YAxis
                    yAxisId="prenotazioni"
                    orientation="right"
                    label={{
                      value: visualizzazioneCumulativa ? "Prenotazioni Cumulative" : "Prenotazioni",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip
                    formatter={formatTooltip}
                    labelFormatter={(label) => {
                      try {
                        const periodo = granularitaSettimanale ? "Settimana del" : "Giorno"
                        return `${periodo} ${format(parseISO(label as string), "dd MMMM yyyy", { locale: it })}`
                      } catch {
                        return label
                      }
                    }}
                  />
                  <Legend />

                  {/* Linee per i prezzi */}
                  {filtriSelezionati.map((filtro, index) => (
                    <Line
                      key={`prezzo_${index}`}
                      yAxisId="prezzo"
                      type="monotone"
                      dataKey={`prezzo_${index}`}
                      stroke={filtro.colore ?? COLORI_SET[index % COLORI_SET.length].primario}
                      strokeWidth={2}
                      dot={{
                        fill: filtro.colore ?? COLORI_SET[index % COLORI_SET.length].primario,
                        strokeWidth: 2,
                        r: 4,
                      }}
                      name={`${filtro.nome_display} - Prezzo`}
                      connectNulls={false}
                    />
                  ))}

                  {/* Barre per le prenotazioni */}
                  {filtriSelezionati.map((filtro, index) => (
                    <Bar
                      key={`prenotazioni_${index}`}
                      yAxisId="prenotazioni"
                      dataKey={`prenotazioni_${index}`}
                      fill={(filtro.colore ?? COLORI_SET[index % COLORI_SET.length].primario) + "40"}
                      name={`${filtro.nome_display} - ${visualizzazioneCumulativa ? "Prenotazioni Cumulative" : "Prenotazioni"}`}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
