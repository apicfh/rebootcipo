import type React from "react"
import type { DatiAnalisiPrezzo, FiltroSelezionato } from "@/lib/services/analisi-prezzo-service"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface GraficoAnalisiPrezzoProps {
  datiSets: Record<string, DatiAnalisiPrezzo>
  filtriSelezionati: FiltroSelezionato[]
  loading?: boolean
}

const GraficoAnalisiPrezzo: React.FC<GraficoAnalisiPrezzoProps> = ({ datiSets, filtriSelezionati, loading }) => {
  if (loading) {
    return <div>Loading...</div>
  }

  if (!datiSets || Object.keys(datiSets).length === 0) {
    return <div>No data available.</div>
  }

  const data = Object.entries(datiSets).reduce(
    (acc, [key, dati]) => {
      dati.dati.forEach((item, index) => {
        if (!acc[index]) {
          acc[index] = { name: item.etichetta }
        }
        acc[index][key] = item.valore
      })
      return acc
    },
    [] as Record<string, number | string>[],
  )

  const colori = ["#8884d8", "#82ca9d", "#ffc658", "#a45de2", "#d43de2"] // Example colors, can be expanded

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.keys(datiSets).map((key, index) => (
          <Line key={key} type="monotone" dataKey={key} stroke={colori[index % colori.length]} activeDot={{ r: 8 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default GraficoAnalisiPrezzo
