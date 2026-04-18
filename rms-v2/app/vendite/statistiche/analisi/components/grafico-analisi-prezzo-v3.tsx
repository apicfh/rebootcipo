"use client"

import { useMemo } from "react"
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts"
import { format, parseISO, isValid, eachDayOfInterval, isWithinInterval } from "date-fns"
import { it } from "date-fns/locale"
import type { DatiAnalisiPrezzo } from "@/lib/services/analisi-prezzo-service"

interface CombinazioneConfronto {
  id: string
  nomeDisplay: string
  colore: string
  datiNormalizzati?: DatiAnalisiPrezzo | null
}

interface GraficoAnalisiPrezzoV3Props {
  dati: DatiAnalisiPrezzo
  datiConfronto?: CombinazioneConfronto[]
  mostraPrezzi: boolean
  mostraPrenotazioni: boolean
  prenotazioniCumulative: boolean
  adattaAssi: boolean
  nomeDisplay: string
}

export function GraficoAnalisiPrezzoV3({
  dati,
  datiConfronto = [],
  mostraPrezzi,
  mostraPrenotazioni,
  prenotazioniCumulative,
  adattaAssi,
  nomeDisplay,
}: GraficoAnalisiPrezzoV3Props) {
  const datiGrafico = useMemo(() => {
    const rangeInizio = new Date(2024, 9, 1) // 1 ottobre 2024
    const rangeFine = new Date(2025, 8, 30) // 30 settembre 2025

    // Generate all days in the fixed range
    const giorniFissi = eachDayOfInterval({ start: rangeInizio, end: rangeFine })

    // Function to normalize a date to the fixed range (ignore year, keep month/day)
    const normalizzaData = (dataOriginale: string): string | null => {
      try {
        const data = parseISO(dataOriginale)
        if (!isValid(data)) return null

        const mese = data.getMonth()
        const giorno = data.getDate()
        const annoOriginale = data.getFullYear()

        // Our fiscal year runs from October 1, 2024 to September 30, 2025
        let dataNormalizzata: Date

        if (mese >= 9) {
          // October to December - always map to 2024 in our range
          dataNormalizzata = new Date(2024, mese, giorno)
        } else {
          // January to September - map to 2025 in our range
          dataNormalizzata = new Date(2025, mese, giorno)
        }

        // Check if the normalized date is within our fixed range
        if (dataNormalizzata >= rangeInizio && dataNormalizzata <= rangeFine) {
          return format(dataNormalizzata, "yyyy-MM-dd")
        }

        return null
      } catch {
        return null
      }
    }

    let cumulativePrenotazioni = 0
    let prezzoPrec = null

    // Initialize cumulative counters for comparisons
    const cumulativeConfronti = datiConfronto.reduce(
      (acc, confronto) => {
        acc[confronto.id] = 0
        return acc
      },
      {} as Record<string, number>,
    )

    return giorniFissi
      .map((giornoFisso) => {
        const dataFissa = format(giornoFisso, "yyyy-MM-dd")

        // Find valid price for this normalized date (main series)
        const prezzoValido = dati.prezzi.find((prezzo) => {
          if (!prezzo.valido_da || !prezzo.valido_a) return false
          try {
            const dataInizioNorm = normalizzaData(prezzo.valido_da)
            const dataFineNorm = normalizzaData(prezzo.valido_a)

            if (!dataInizioNorm || !dataFineNorm) return false

            const dataInizio = parseISO(dataInizioNorm)
            const dataFine = parseISO(dataFineNorm)
            const dataCorrente = parseISO(dataFissa)

            if (dataInizio <= dataFine) {
              // Normal period within the same fiscal year
              return (
                isValid(dataInizio) &&
                isValid(dataFine) &&
                isValid(dataCorrente) &&
                isWithinInterval(dataCorrente, { start: dataInizio, end: dataFine })
              )
            } else {
              // Cross-year period (e.g., August 2025 to May 2026 becomes August 2024 to May 2025)
              // This means the period wraps around: from start to end of fiscal year, then from start of fiscal year to end
              return (
                isValid(dataInizio) &&
                isValid(dataFine) &&
                isValid(dataCorrente) &&
                (dataCorrente >= dataInizio || dataCorrente <= dataFine)
              )
            }
          } catch {
            return false
          }
        })

        // Count bookings for this normalized date (main series)
        const prenotazioniGiorno = dati.prenotazioni.filter((p) => {
          const dataNorm = normalizzaData(p.data_prenotazione)
          return dataNorm === dataFissa
        }).length

        // Calculate cumulative
        cumulativePrenotazioni += prenotazioniGiorno

        // Determine if there was a price change
        const prezzoAttuale = prezzoValido?.prezzo || null
        const variazioneDiPrezzo = prezzoAttuale !== null && prezzoPrec !== null && prezzoAttuale !== prezzoPrec

        // Update previous price only if we have a valid price
        if (prezzoAttuale !== null) {
          prezzoPrec = prezzoAttuale
        }

        const datiConfrontoGiorno: Record<string, any> = {}

        datiConfronto.forEach((confronto) => {
          if (!confronto.datiNormalizzati) return

          // Find valid price for comparison (normalized)
          const prezzoValidoConfronto = confronto.datiNormalizzati.prezzi.find((prezzo) => {
            if (!prezzo.valido_da || !prezzo.valido_a) return false
            try {
              const dataInizioNorm = normalizzaData(prezzo.valido_da)
              const dataFineNorm = normalizzaData(prezzo.valido_a)

              if (!dataInizioNorm || !dataFineNorm) return false

              const dataInizio = parseISO(dataInizioNorm)
              const dataFine = parseISO(dataFineNorm)
              const dataCorrente = parseISO(dataFissa)

              if (dataInizio <= dataFine) {
                // Normal period within the same fiscal year
                return (
                  isValid(dataInizio) &&
                  isValid(dataFine) &&
                  isValid(dataCorrente) &&
                  isWithinInterval(dataCorrente, { start: dataInizio, end: dataFine })
                )
              } else {
                // Cross-year period
                return (
                  isValid(dataInizio) &&
                  isValid(dataFine) &&
                  isValid(dataCorrente) &&
                  (dataCorrente >= dataInizio || dataCorrente <= dataFine)
                )
              }
            } catch {
              return false
            }
          })

          // Count bookings for comparison (normalized)
          const prenotazioniGiornoConfronto = confronto.datiNormalizzati.prenotazioni.filter((p) => {
            const dataNorm = normalizzaData(p.data_prenotazione)
            return dataNorm === dataFissa
          }).length

          // Update cumulative for comparison
          cumulativeConfronti[confronto.id] += prenotazioniGiornoConfronto

          // Add to chart data
          datiConfrontoGiorno[`prezzo_${confronto.id}`] = prezzoValidoConfronto?.prezzo || null
          datiConfrontoGiorno[`prenotazioni_${confronto.id}`] = prenotazioniGiornoConfronto
          datiConfrontoGiorno[`prenotazioni_cumulative_${confronto.id}`] = cumulativeConfronti[confronto.id]
        })

        try {
          return {
            data: dataFissa,
            dataFormattata: format(giornoFisso, "dd/MM", { locale: it }),
            prezzo: prezzoAttuale,
            prenotazioni: prenotazioniGiorno,
            prenotazioniCumulative: cumulativePrenotazioni,
            variazioneDiPrezzo: variazioneDiPrezzo,
            dataCompleta: format(giornoFisso, "dd MMMM", { locale: it }),
            ...datiConfrontoGiorno,
          }
        } catch (error) {
          console.error(`Errore nel processing della data ${dataFissa}:`, error)
          return null
        }
      })
      .filter(Boolean) // Remove any null values
  }, [dati, datiConfronto])

  // Calcola i valori massimi per gli assi
  const maxPrenotazioni = useMemo(() => {
    if (!datiGrafico || datiGrafico.length === 0) return 10

    if (prenotazioniCumulative) {
      const maxPrincipale = Math.max(...datiGrafico.map((d) => d.prenotazioniCumulative || 0))
      const maxConfronti = datiConfronto.reduce((max, confronto) => {
        const maxConfronto = Math.max(...datiGrafico.map((d) => d[`prenotazioni_cumulative_${confronto.id}`] || 0))
        return Math.max(max, maxConfronto)
      }, 0)
      return Math.max(maxPrincipale, maxConfronti) * 1.1
    } else {
      const maxPrincipale = Math.max(...datiGrafico.map((d) => d.prenotazioni || 0))
      const maxConfronti = datiConfronto.reduce((max, confronto) => {
        const maxConfronto = Math.max(...datiGrafico.map((d) => d[`prenotazioni_${confronto.id}`] || 0))
        return Math.max(max, maxConfronto)
      }, 0)
      return Math.max(maxPrincipale, maxConfronti) * 1.2
    }
  }, [datiGrafico, prenotazioniCumulative, datiConfronto])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Trova il dato completo per questa data
      const datoCompleto = datiGrafico.find((d) => d.dataFormattata === label)
      if (!datoCompleto) return null

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{datoCompleto.dataCompleta}</p>

          {payload.map((entry: any, index: number) => {
            // Personalizza in base al tipo di dato
            if (entry.name === "Prezzo" && entry.value !== null) {
              return (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span className="font-medium text-blue-600">Prezzo:</span>
                  <span className="font-bold">€{entry.value.toFixed(2)}</span>
                </div>
              )
            }

            if (entry.name === "Prenotazioni Giornaliere") {
              return (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-600">Prenotazioni:</span>
                  <span className="font-bold">{entry.value}</span>
                </div>
              )
            }

            if (entry.name === "Prenotazioni Cumulative") {
              return (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-600">Totale prenotazioni:</span>
                  <span className="font-bold">{entry.value}</span>
                </div>
              )
            }

            if (entry.name.includes(" - ") && entry.value !== null && entry.value !== undefined) {
              const isPrice = entry.name.includes("Prezzo")
              const isBookings = entry.name.includes("Prenotazioni")
              const color = entry.color || "#666"

              return (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span className="font-medium" style={{ color }}>
                    {entry.name}:
                  </span>
                  <span className="font-bold">{isPrice ? `€${Number(entry.value).toFixed(2)}` : entry.value}</span>
                </div>
              )
            }

            return null
          })}
        </div>
      )
    }
    return null
  }

  // Funzione per renderizzare i punti solo quando c'è una variazione di prezzo
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props

    // Mostra il punto solo se c'è una variazione di prezzo o è il primo punto
    if (payload.variazioneDiPrezzo) {
      return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />
    }
    return null
  }

  const renderComparisonDot = (color: string) => (props: any) => {
    const { cx, cy, payload } = props
    if (payload.variazioneDiPrezzo) {
      return <circle cx={cx} cy={cy} r={3} fill={color} stroke="#ffffff" strokeWidth={1} />
    }
    return null
  }

  // ✅ Controllo di sicurezza: se non ci sono dati validi, mostra messaggio
  if (!datiGrafico || datiGrafico.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <p className="text-muted-foreground">Nessun dato valido da visualizzare</p>
      </div>
    )
  }

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={datiGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dataFormattata" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />

          {/* Asse Y per i prezzi con dominio adattabile */}
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12 }}
            domain={adattaAssi ? [200, 600] : ["auto", "auto"]}
            label={{ value: "Prezzo (€)", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
          />

          {/* Asse Y per le prenotazioni */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            domain={[0, adattaAssi ? Math.ceil(maxPrenotazioni / 5) * 5 : "auto"]}
            label={{ value: "Prenotazioni", angle: 90, position: "insideRight", style: { textAnchor: "middle" } }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {mostraPrenotazioni && !prenotazioniCumulative && (
            <Bar
              yAxisId="right"
              dataKey="prenotazioni"
              fill="#10b981"
              fillOpacity={0.6}
              name="Prenotazioni Giornaliere"
            />
          )}

          {mostraPrenotazioni && prenotazioniCumulative && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="prenotazioniCumulative"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10b981", strokeWidth: 1, stroke: "#ffffff" }}
              name="Prenotazioni Cumulative"
            />
          )}

          {mostraPrezzi && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="prezzo"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={renderDot}
              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
              name="Prezzo"
              connectNulls={false}
            />
          )}

          {datiConfronto.map((confronto) =>
            [
              // Comparison prices
              mostraPrezzi && (
                <Line
                  key={`prezzo-${confronto.id}`}
                  yAxisId="left"
                  type="monotone"
                  dataKey={`prezzo_${confronto.id}`}
                  stroke={confronto.colore}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={renderComparisonDot(confronto.colore)}
                  name={`Prezzo - ${confronto.nomeDisplay}`}
                  connectNulls={false}
                />
              ),

              // Comparison bookings - daily
              mostraPrenotazioni && !prenotazioniCumulative && (
                <Bar
                  key={`prenotazioni-${confronto.id}`}
                  yAxisId="right"
                  dataKey={`prenotazioni_${confronto.id}`}
                  fill={confronto.colore}
                  fillOpacity={0.4}
                  name={`Prenotazioni - ${confronto.nomeDisplay}`}
                />
              ),

              // Comparison bookings - cumulative
              mostraPrenotazioni && prenotazioniCumulative && (
                <Line
                  key={`prenotazioni-cum-${confronto.id}`}
                  yAxisId="right"
                  type="monotone"
                  dataKey={`prenotazioni_cumulative_${confronto.id}`}
                  stroke={confronto.colore}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: confronto.colore, strokeWidth: 1, stroke: "#ffffff" }}
                  name={`Prenotazioni Cumulative - ${confronto.nomeDisplay}`}
                />
              ),
            ].filter(Boolean),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
