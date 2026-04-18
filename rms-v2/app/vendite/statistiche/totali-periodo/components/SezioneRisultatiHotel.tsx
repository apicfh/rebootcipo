"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { RisultatoPerHotelType } from "../types"
import { formatCurrency, formatNumber, formatPercent, chartColors } from "../utils"

interface SezioneRisultatiHotelProps {
  risultatiPerHotel: RisultatoPerHotelType[]
}

export function SezioneRisultatiHotel({ risultatiPerHotel }: SezioneRisultatiHotelProps) {
  return (
    <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b-2 border-secondary-200">
        <CardTitle className="text-primary">Risultati per Hotel</CardTitle>
      </CardHeader>
      <CardContent>
        {risultatiPerHotel.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nessun dato disponibile per gli hotel selezionati nel periodo indicato.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={risultatiPerHotel} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="nome_hotel"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    axisLine={{ stroke: "#333", strokeWidth: 2 }}
                    tickLine={{ stroke: "#333", strokeWidth: 1 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={{ stroke: "#333", strokeWidth: 2 }}
                    tickLine={{ stroke: "#333", strokeWidth: 1 }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "tassoOccupazione") return `${Number(value).toFixed(2)}%`
                      return value
                    }}
                    labelFormatter={(label) => `Hotel: ${label}`}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar
                    dataKey="tassoOccupazione"
                    name="Tasso di Occupazione (%)"
                    fill={chartColors.tassoOccupazione}
                    radius={[8, 8, 0, 0]}
                    barSize={30}
                    style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary-50">
                    <TableHead className="font-bold">Hotel</TableHead>
                    <TableHead className="text-right font-bold">Notti Disponibili</TableHead>
                    <TableHead className="text-right font-bold">Notti Prenotate</TableHead>
                    <TableHead className="text-right font-bold">Fatturato</TableHead>
                    <TableHead className="text-right font-bold">ADR</TableHead>
                    <TableHead className="text-right font-bold">Tasso Occupazione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risultatiPerHotel.map((r) => (
                    <TableRow key={r.id_hotel} className="hover:bg-secondary-50">
                      <TableCell className="font-medium">{r.nome_hotel}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.nottiDisponibili)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.nottiPrenotate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.fatturato)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.adr)}</TableCell>
                      <TableCell className="text-right">{formatPercent(r.tassoOccupazione)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
