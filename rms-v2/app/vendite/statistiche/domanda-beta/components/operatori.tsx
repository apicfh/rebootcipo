"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GaugeChart } from "@/components/charts/gauge-chart"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface OperatoriProps {
  data: {
    operatoriStats: any[]
    hotelDistribution: any[]
    conversionStats: any[]
    performanceMensile: any[]
  }
  loading: boolean
  onOperatorChange?: (operatorId: string) => void
  selectedOperator: string
  dateRange: {
    startDate: Date | null
    endDate: Date | null
  }
  tipoPeriodo: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

export function Operatori({ data, loading, onOperatorChange, selectedOperator, dateRange }: OperatoriProps) {
  // Aggiungi un log all'inizio del componente per vedere i dati ricevuti
  console.log("Dati ricevuti nel componente Operatori:", data)
  const [operatoriData, setOperatoriData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [totaleElaborati, setTotaleElaborati] = useState<number>(0)
  const [tassoConversione, setTassoConversione] = useState<number>(0)
  const [operatori, setOperatori] = useState<{ id: string; nome: string }[]>([
    { id: "tutti", nome: "Tutti gli operatori" },
  ])
  const [importoTotale, setImportoTotale] = useState<number>(0)
  const [clientiUnici, setClientiUnici] = useState<number>(0)
  const [dettaglioHotel, setDettaglioHotel] = useState<any[]>([])
  const [performanceMensile, setPerformanceMensile] = useState<any[]>([])

  useEffect(() => {
    console.log("Dati operatori completi:", data)
    console.log("operatoriStats:", data.operatoriStats)
    console.log("hotelDistribution:", data.hotelDistribution)
    console.log("conversionStats:", data.conversionStats)

    // Debug per vedere la struttura esatta dei dati
    //console.log("Dati operatori completi:", data)

    // Verifica se abbiamo dati validi
    if (!data) {
      console.log("Nessun dato ricevuto")
      return
    }

    // Verifica la struttura dei dati operatoriStats
    //console.log("operatoriStats:", data.operatoriStats)

    // Verifica se operatoriStats è un array
    if (!Array.isArray(data.operatoriStats)) {
      console.log("operatoriStats non è un array:", data.operatoriStats)
      return
    }

    // Se l'array è vuoto, non ci sono dati da mostrare
    if (data.operatoriStats.length === 0) {
      console.log("operatoriStats è un array vuoto")
      return
    }

    // Estrai gli operatori unici
    const operatoriList = data.operatoriStats.map((op) => {
      console.log("Operatore:", op)
      return {
        id: op.operatore_creazione || "non_specificato",
        nome: op.operatore_creazione || "Non specificato",
      }
    })

    console.log("Lista operatori estratta:", operatoriList)

    // Rimuovi duplicati
    const uniqueOperators = operatoriList.filter((op, index, self) => index === self.findIndex((o) => o.id === op.id))

    console.log("Operatori unici:", uniqueOperators)

    // Aggiungi l'opzione "Tutti gli operatori" all'inizio
    setOperatori([{ id: "tutti", nome: "Tutti gli operatori" }, ...uniqueOperators])

    // Prepara i dati per il grafico a barre degli operatori
    setOperatoriData(
      data.operatoriStats.map((op) => ({
        name: op.operatore_creazione || "Non specificato",
        count: op.totale_preventivi || 0,
        importo: op.importo_totale || 0,
        tasso: op.tasso_conversione || 0,
      })),
    )

    // Filtra i dati in base all'operatore selezionato
    if (selectedOperator === "tutti") {
      // Calcola il totale degli elaborati
      setTotaleElaborati(data.operatoriStats.reduce((sum, op) => sum + (op.totale_preventivi || 0), 0))

      // Calcola il tasso di conversione medio ponderato
      const totalPreventivi = data.operatoriStats.reduce((sum, op) => sum + (op.totale_preventivi || 0), 0)
      const totalConversioni = data.operatoriStats.reduce((sum, op) => sum + (op.prenotazioni_convertite || 0), 0)
      setTassoConversione(totalPreventivi > 0 ? (totalConversioni / totalPreventivi) * 100 : 0)

      // Calcola l'importo totale
      setImportoTotale(data.operatoriStats.reduce((sum, op) => sum + (op.importo_totale || 0), 0))

      // Calcola i clienti unici
      setClientiUnici(data.operatoriStats.reduce((sum, op) => sum + (op.clienti_unici || 0), 0))

      // Verifica la struttura dei dati hotelDistribution
      //console.log("hotelDistribution:", data.hotelDistribution)

      // Prepara i dati per il grafico a torta della distribuzione per hotel
      if (Array.isArray(data.hotelDistribution) && data.hotelDistribution.length > 0) {
        const hotelDistribution = data.hotelDistribution.reduce((acc, item) => {
          const hotelName = item.nome_hotel || "Non specificato"

          if (!acc[hotelName]) {
            acc[hotelName] = {
              name: hotelName,
              value: 0,
            }
          }

          acc[hotelName].value += item.preventivi_per_hotel || 0

          return acc
        }, {})

        setPieData(Object.values(hotelDistribution))
      } else {
        setPieData([])
      }

      // Prepara i dati per il dettaglio hotel
      setDettaglioHotel(Array.isArray(data.conversionStats) ? data.conversionStats : [])

      // Prepara i dati per la performance mensile
      setPerformanceMensile(Array.isArray(data.performanceMensile) ? data.performanceMensile : [])
    } else {
      // Filtra per l'operatore selezionato
      const operatorData = data.operatoriStats.find((op) => op.operatore_creazione === selectedOperator)

      if (operatorData) {
        setTotaleElaborati(operatorData.totale_preventivi || 0)
        setTassoConversione(operatorData.tasso_conversione || 0)
        setImportoTotale(operatorData.importo_totale || 0)
        setClientiUnici(operatorData.clienti_unici || 0)
      } else {
        setTotaleElaborati(0)
        setTassoConversione(0)
        setImportoTotale(0)
        setClientiUnici(0)
      }

      // Filtra la distribuzione per hotel per questo operatore
      if (Array.isArray(data.hotelDistribution)) {
        const hotelDistForOperator = data.hotelDistribution.filter(
          (item) => item.operatore_creazione === selectedOperator,
        )

        setPieData(
          hotelDistForOperator.map((item) => ({
            name: item.nome_hotel || "Non specificato",
            value: item.preventivi_per_hotel || 0,
          })),
        )
      } else {
        setPieData([])
      }

      // Filtra il dettaglio hotel per questo operatore
      setDettaglioHotel(Array.isArray(data.conversionStats) ? data.conversionStats : [])

      // Filtra la performance mensile per questo operatore
      if (Array.isArray(data.performanceMensile)) {
        const filteredPerformance = data.performanceMensile.filter(
          (item) => item.operatore_creazione === selectedOperator,
        )
        setPerformanceMensile(filteredPerformance)
      } else {
        setPerformanceMensile([])
      }
    }
  }, [data, selectedOperator])

  const handleOperatorChange = (operatorId: string) => {
    console.log("Operatore selezionato:", operatorId)
    if (onOperatorChange) {
      onOperatorChange(operatorId)
    }
  }

  // Formatta il numero come valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
  }

  // Formatta il mese per la visualizzazione
  const formatMonth = (month: number, year: number) => {
    try {
      const date = new Date(year, month - 1, 1)
      return format(date, "MMMM yyyy", { locale: it })
    } catch (error) {
      console.error("Errore nella formattazione del mese:", error)
      return `${month}/${year}`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Verifica se abbiamo dati da mostrare
  const hasData = data && data.operatoriStats && Array.isArray(data.operatoriStats) && data.operatoriStats.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-80">
        <p className="text-lg text-muted-foreground mb-2">Nessun dato disponibile</p>
        <p className="text-sm text-muted-foreground">Prova a modificare i filtri o a selezionare un periodo diverso</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Select value={selectedOperator} onValueChange={handleOperatorChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleziona operatore" />
          </SelectTrigger>
          <SelectContent>
            {operatori.map((operatore) => (
              <SelectItem key={operatore.id} value={operatore.id}>
                {operatore.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prima riga: Box con valori numerici affiancati */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box Elaborati */}
        <Card>
          <CardHeader>
            <CardTitle>Preventivi Elaborati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">{totaleElaborati}</div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {selectedOperator === "tutti"
                ? "Totale preventivi elaborati"
                : `Preventivi elaborati da ${selectedOperator}`}
            </p>
          </CardContent>
        </Card>

        {/* Box Tasso di Conversione */}
        <Card>
          <CardHeader>
            <CardTitle>Tasso di Conversione</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <GaugeChart value={tassoConversione} size={150} thickness={30} />
          </CardContent>
        </Card>

        {/* Box Importo Totale */}
        <Card>
          <CardHeader>
            <CardTitle>Importo Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">{formatCurrency(importoTotale)}</div>
            <p className="text-sm text-muted-foreground text-center mt-2">Valore totale dei preventivi</p>
          </CardContent>
        </Card>

        {/* Box Clienti Unici */}
        <Card>
          <CardHeader>
            <CardTitle>Clienti Unici</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">{clientiUnici}</div>
            <p className="text-sm text-muted-foreground text-center mt-2">Numero di clienti unici</p>
          </CardContent>
        </Card>
      </div>

      {/* Seconda riga: Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico a barre per operatori */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Operatori</CardTitle>
            <CardDescription>Numero di preventivi elaborati per operatore</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {operatoriData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operatoriData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}`, "Preventivi"]} />
                  <Legend />
                  <Bar dataKey="count" name="Preventivi" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">Nessun dato disponibile</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafico a torta per distribuzione hotel */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione per Hotel</CardTitle>
            <CardDescription>Ripartizione dei preventivi per hotel</CardDescription>
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
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} preventivi`, "Quantità"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">Nessun dato disponibile</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terza riga: Tabella dettaglio hotel */}
      <Card>
        <CardHeader>
          <CardTitle>Dettaglio Performance per Hotel</CardTitle>
          <CardDescription>Analisi dettagliata delle conversioni per hotel</CardDescription>
        </CardHeader>
        <CardContent>
          {dettaglioHotel.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel</TableHead>
                    <TableHead className="text-right">Preventivi</TableHead>
                    <TableHead className="text-right">Prenotazioni</TableHead>
                    <TableHead className="text-right">Tasso Conversione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dettaglioHotel.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.nome_hotel || "Non specificato"}</TableCell>
                      <TableCell className="text-right">{item.totale_preventivi || 0}</TableCell>
                      <TableCell className="text-right">{item.prenotazioni_convertite || 0}</TableCell>
                      <TableCell className="text-right">{item.tasso_conversione || 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">Nessun dato disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quarta riga: Grafico tasso di conversione per operatore */}
      <Card>
        <CardHeader>
          <CardTitle>Tasso di Conversione per Operatore</CardTitle>
          <CardDescription>Confronto del tasso di conversione tra operatori</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {operatoriData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatoriData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, "Tasso di Conversione"]} />
                <Legend />
                <Bar dataKey="tasso" name="Tasso di Conversione" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Nessun dato disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quinta riga: Grafico performance mensile */}
      {performanceMensile.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensile</CardTitle>
            <CardDescription>Andamento mensile dei preventivi e delle conversioni</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceMensile.map((item) => ({
                  ...item,
                  month: formatMonth(item.mese, item.anno),
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "tasso_conversione") return [`${value}%`, "Tasso di Conversione"]
                    if (name === "totale_preventivi") return [`${value}`, "Preventivi"]
                    if (name === "prenotazioni_convertite") return [`${value}`, "Prenotazioni"]
                    return [value, name]
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totale_preventivi"
                  name="Preventivi"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="prenotazioni_convertite"
                  name="Prenotazioni"
                  stroke="#82ca9d"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tasso_conversione"
                  name="Tasso di Conversione"
                  stroke="#ff7300"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
