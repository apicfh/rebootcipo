"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addDays, parseISO, format } from "date-fns"

// 1. Aggiungi l'import per il GaugeChart
import { GaugeChart } from "@/components/charts/gauge-chart"

interface VenditaCamereProps {
  data: {
    preventivi: any[]
    conversionData: any[]
    tipoCameraStats?: any[]
    prenotazioni?: any[]
  }
  loading: boolean
  confrontoAnnoPrec: boolean
  tipoPeriodo?: string
}

// Colori per i grafici
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

export function VenditaCamere({ data, loading, confrontoAnnoPrec, tipoPeriodo = "soggiorno" }: VenditaCamereProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [conversionData, setConversionData] = useState<any[]>([])
  const [tipoCameraStats, setTipoCameraStats] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [durataSoggiornoData, setDurataSoggiornoData] = useState<any[]>([])

  useEffect(() => {
    if (data && data.preventivi && data.preventivi.length > 0) {
      console.log("Dati preventivi in VenditaCamere:", data.preventivi)

      // Prepara i dati per il grafico dell'andamento notti (prenotazioni)
      if (data.prenotazioni && data.prenotazioni.length > 0) {
        console.log("Preparazione dati distribuzione notti per prenotazioni:", data.prenotazioni.length)

        // Trova il periodo minimo e massimo per creare un array di tutti i giorni
        // Importante: usiamo sempre le date di soggiorno (arrivo/partenza) per la visualizzazione
        let minDate: Date | null = null
        let maxDate: Date | null = null

        data.prenotazioni.forEach((item) => {
          if (!item.arrivo || !item.notti) return

          const arrivalDate = new Date(item.arrivo)
          if (!minDate || arrivalDate < minDate) {
            minDate = arrivalDate
          }

          const departureDate = new Date(arrivalDate)
          departureDate.setDate(departureDate.getDate() + item.notti)
          if (!maxDate || departureDate > maxDate) {
            maxDate = departureDate
          }
        })

        // Se non abbiamo date valide, usciamo
        if (!minDate || !maxDate) {
          setChartData([])
          return
        }

        // Crea un oggetto per ogni giorno nel periodo
        const dailyData: Record<
          string,
          {
            date: string
            formattedDate: string
            notti: number
            nottiPrevYear: number
          }
        > = {}

        // Inizializza l'array con tutti i giorni nel periodo
        let currentDate = new Date(minDate)
        while (currentDate <= maxDate) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          dailyData[dateKey] = {
            date: dateKey,
            formattedDate: format(currentDate, "dd/MM"),
            notti: 0,
            nottiPrevYear: 0,
          }
          currentDate = addDays(currentDate, 1)
        }

        // Per ogni prenotazione, distribuisci le notti sui giorni effettivi del soggiorno
        data.prenotazioni.forEach((item) => {
          if (!item.arrivo || !item.notti) return

          const arrivalDate = new Date(item.arrivo)
          const year = arrivalDate.getFullYear()
          const currentYear = new Date().getFullYear()

          // Per ogni giorno del soggiorno, incrementa il contatore appropriato
          for (let i = 0; i < item.notti; i++) {
            const stayDate = addDays(arrivalDate, i)
            const dateKey = format(stayDate, "yyyy-MM-dd")

            // Se la data è nel nostro range
            if (dailyData[dateKey]) {
              if (year === currentYear) {
                dailyData[dateKey].notti += 1
              } else if (year === currentYear - 1 && confrontoAnnoPrec) {
                // Sposta la data all'anno corrente per il confronto
                const adjustedDate = new Date(stayDate)
                adjustedDate.setFullYear(currentYear)
                const adjustedKey = format(adjustedDate, "yyyy-MM-dd")

                if (dailyData[adjustedKey]) {
                  dailyData[adjustedKey].nottiPrevYear += 1
                }
              }
            }
          }
        })

        // Converti l'oggetto in array e ordina per data
        const sortedChartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
        console.log("Dati distribuzione notti elaborati:", sortedChartData.length)
        setChartData(sortedChartData)
      } else {
        setChartData([])
      }

      // Prepara i dati per il grafico dell'andamento durata soggiorno (preventivi_elaborati)
      // Qui dobbiamo "spalmare" la durata di ogni soggiorno su tutti i giorni in cui si svolgerebbe
      // Importante: usiamo sempre le date di soggiorno (data_arrivo/data_partenza) per la visualizzazione

      // Trova il periodo minimo e massimo per creare un array di tutti i giorni
      let minDate: Date | null = null
      let maxDate: Date | null = null

      data.preventivi.forEach((item) => {
        if (!item.data_arrivo) return

        const arrivalDate = parseISO(item.data_arrivo)
        const durataSoggiorno = item.durata_soggiorno || 0

        if (!minDate || arrivalDate < minDate) {
          minDate = arrivalDate
        }

        const endDate = addDays(arrivalDate, durataSoggiorno)
        if (!maxDate || endDate > maxDate) {
          maxDate = endDate
        }
      })

      // Se non abbiamo date valide, usciamo
      if (!minDate || !maxDate) {
        setDurataSoggiornoData([])
        return
      }

      // Crea un oggetto per ogni giorno nel periodo
      const dailyData: Record<
        string,
        {
          date: string
          formattedDate: string
          nottiRichieste: number
          nottiRichiestePrevYear: number
        }
      > = {}

      // Inizializza l'array con tutti i giorni nel periodo
      let currentDate = new Date(minDate)
      while (currentDate <= maxDate) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        dailyData[dateKey] = {
          date: dateKey,
          formattedDate: format(currentDate, "dd/MM"),
          nottiRichieste: 0,
          nottiRichiestePrevYear: 0,
        }
        currentDate = addDays(currentDate, 1)
      }

      // Per ogni preventivo, distribuisci la durata del soggiorno su tutti i giorni
      data.preventivi.forEach((item) => {
        if (!item.data_arrivo || !item.durata_soggiorno) return

        const arrivalDate = parseISO(item.data_arrivo)
        const durataSoggiorno = item.durata_soggiorno

        // Determina se il preventivo è dell'anno corrente o dell'anno precedente
        const year = arrivalDate.getFullYear()
        const currentYear = new Date().getFullYear()

        // Per ogni giorno del soggiorno, incrementa il contatore appropriato
        for (let i = 0; i < durataSoggiorno; i++) {
          const stayDate = addDays(arrivalDate, i)
          const dateKey = format(stayDate, "yyyy-MM-dd")

          // Se la data è nel nostro range
          if (dailyData[dateKey]) {
            if (year === currentYear) {
              dailyData[dateKey].nottiRichieste += 1
            } else if (year === currentYear - 1 && confrontoAnnoPrec) {
              // Sposta la data all'anno corrente per il confronto
              const adjustedDate = new Date(stayDate)
              adjustedDate.setFullYear(currentYear)
              const adjustedKey = format(adjustedDate, "yyyy-MM-dd")

              if (dailyData[adjustedKey]) {
                dailyData[adjustedKey].nottiRichiestePrevYear += 1
              }
            }
          }
        }
      })

      // Converti l'oggetto in array e ordina per data
      const durataSoggiornoArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
      setDurataSoggiornoData(durataSoggiornoArray)

      // Prepara i dati per l'analisi dettagliata per tipo camera
      // Utilizziamo direttamente i dati delle prenotazioni
      if (data.prenotazioni && data.prenotazioni.length > 0) {
        const tipoCameraMap = new Map()

        // Raggruppa le prenotazioni per tipo camera
        data.prenotazioni.forEach((item) => {
          const tipoCamera = item.tipo_camera || "Non specificato"
          const notti = item.notti || 0
          const fatturato = item.totale_soggiorno || 0

          if (!tipoCameraMap.has(tipoCamera)) {
            tipoCameraMap.set(tipoCamera, {
              tipo: tipoCamera,
              count: 0,
              notti: 0,
              importo: 0,
            })
          }

          const stats = tipoCameraMap.get(tipoCamera)
          stats.count += 1
          stats.notti += notti
          stats.importo += fatturato
        })

        // Calcola statistiche aggiuntive e converti in array
        const totalPrenotazioni = data.prenotazioni.length
        const tipoCameraStatsArray = Array.from(tipoCameraMap.values())
          .map((stats) => {
            const adr = stats.notti > 0 ? stats.importo / stats.notti : 0
            const percentuale = totalPrenotazioni > 0 ? (stats.count / totalPrenotazioni) * 100 : 0

            return {
              ...stats,
              adr,
              percentuale,
            }
          })
          .sort((a, b) => b.count - a.count)

        setTipoCameraStats(tipoCameraStatsArray)

        // Prepara i dati per il grafico a torta
        let pieChartData = tipoCameraStatsArray
          .map((item) => ({
            name: item.tipo,
            value: item.count,
          }))
          .sort((a, b) => b.value - a.value)

        // Prendi i primi 3 e accorpa il resto in "Altri"
        if (pieChartData.length > 3) {
          const top3 = pieChartData.slice(0, 3)
          const others = pieChartData.slice(3)

          const othersSum = others.reduce((sum, item) => sum + item.value, 0)

          if (othersSum > 0) {
            top3.push({
              name: "Altri",
              value: othersSum,
            })
          }

          pieChartData = top3
        }

        // Aggiungi i colori
        pieChartData = pieChartData.map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length],
        }))

        setPieData(pieChartData)
      } else {
        setTipoCameraStats([])
        setPieData([])
      }

      // Imposta i dati di conversione
      if (data.conversionData && data.conversionData.length > 0) {
        setConversionData(data.conversionData)
      }
    } else {
      // Valori predefiniti se non ci sono dati
      setChartData([])
      setConversionData([])
      setTipoCameraStats([])
      setPieData([])
      setDurataSoggiornoData([])
    }
  }, [data, confrontoAnnoPrec])

  // Formatta il numero come valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grafico Andamento Notti (prenotazioni) */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione prenotazioni</CardTitle>
          <CardDescription>
            {tipoPeriodo === "richiesta"
              ? "Numero di notti prenotate per data di soggiorno (filtrate per data di richiesta)"
              : "Numero di notti prenotate per data di soggiorno"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="formattedDate"
                  interval={Math.max(1, Math.floor(chartData.length / 15))} // Adatta l'intervallo in base al numero di dati
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "notti") return [value, "Notti anno corrente"]
                    if (name === "nottiPrevYear") return [value, "Notti anno precedente"]
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="notti"
                  name="Notti anno corrente"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                {confrontoAnnoPrec && (
                  <Area
                    type="monotone"
                    dataKey="nottiPrevYear"
                    name="Notti anno precedente"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                {data.prenotazioni && data.prenotazioni.length === 0
                  ? "Nessuna prenotazione trovata nel periodo selezionato"
                  : "Nessun dato disponibile"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grafico Durata Soggiorno (preventivi_elaborati) - MODIFICATO */}
      <Card>
        <CardHeader>
          <CardTitle>Pressione Domanda</CardTitle>
          <CardDescription>
            {tipoPeriodo === "richiesta"
              ? "Distribuzione delle notti richieste nei preventivi per data di soggiorno (filtrate per data di richiesta)"
              : "Distribuzione delle notti richieste nei preventivi per data di soggiorno"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {durataSoggiornoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={durataSoggiornoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="formattedDate"
                  interval={Math.max(1, Math.floor(durataSoggiornoData.length / 15))} // Adatta l'intervallo in base al numero di dati
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "nottiRichieste") return [value, "Notti richieste anno corrente"]
                    if (name === "nottiRichiestePrevYear") return [value, "Notti richieste anno precedente"]
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="nottiRichieste"
                  name="Notti richieste anno corrente"
                  stroke="#ff7300"
                  fill="#ff7300"
                  fillOpacity={0.3}
                />
                {confrontoAnnoPrec && (
                  <Area
                    type="monotone"
                    dataKey="nottiRichiestePrevYear"
                    name="Notti richieste anno precedente"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.3}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                {data.preventivi && data.preventivi.length === 0
                  ? "Nessun preventivo trovato nel periodo selezionato"
                  : "Nessun dato disponibile"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sezione per la distribuzione per tipo camera - Solo grafico a torta */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione per Tipo Camera</CardTitle>
          <CardDescription>Suddivisione delle prenotazioni per tipologia di camera</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} ${data.prenotazioni ? "prenotazioni" : "preventivi"}`, "Quantità"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                {data.prenotazioni && data.prenotazioni.length === 0
                  ? "Nessuna prenotazione trovata nel periodo selezionato"
                  : "Nessun dato disponibile"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabella dettagliata per tipo camera */}
      <Card>
        <CardHeader>
          <CardTitle>Analisi Dettagliata per Tipologia di Camera</CardTitle>
          <CardDescription>Statistiche complete suddivise per tipo di camera</CardDescription>
        </CardHeader>
        <CardContent>
          {tipoCameraStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipologia Camera</TableHead>
                    <TableHead className="text-right">Prenotazioni</TableHead>
                    <TableHead className="text-right">Percentuale</TableHead>
                    <TableHead className="text-right">Notti</TableHead>
                    <TableHead className="text-right">Fatturato</TableHead>
                    <TableHead className="text-right">ADR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipoCameraStats.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.tipo}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{item.percentuale.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{item.notti}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.importo)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.adr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">
                {data.prenotazioni && data.prenotazioni.length === 0
                  ? "Nessuna prenotazione trovata nel periodo selezionato"
                  : "Nessun dato disponibile"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasso di Conversione */}
      <Card>
        <CardHeader>
          <CardTitle>Tasso di Conversione</CardTitle>
          <CardDescription>Percentuale di preventivi convertiti in prenotazioni</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          {conversionData.length > 0 ? (
            <div className="flex flex-col items-center">
              <GaugeChart
                value={conversionData.reduce((acc, item) => acc + item.tasso_conversione, 0) / conversionData.length}
                label="Media del periodo"
                size={300}
                thickness={50}
              />
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Basato su {data.prenotazioni?.length || 0} prenotazioni e {data.preventivi?.length || 0} preventivi
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">
                {data.prenotazioni && data.prenotazioni.length === 0
                  ? "Nessuna prenotazione trovata nel periodo selezionato"
                  : "Nessun dato disponibile"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
