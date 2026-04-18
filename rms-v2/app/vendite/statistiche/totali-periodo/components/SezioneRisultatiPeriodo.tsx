"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import type { RisultatoPerPeriodoType } from "../types"
import { formatCurrency, formatNumber, formatPercent, chartColors, chartStyle } from "../utils"

interface SezioneRisultatiPeriodoProps {
  risultatiPerPeriodo: RisultatoPerPeriodoType[]
  risultatiPerPeriodoSDLY: RisultatoPerPeriodoType[]
  risultatiPerPeriodoLY: RisultatoPerPeriodoType[]
  confrontoSDLY: boolean
  confrontoLY: boolean
  visualizzazioneDati: "tabella" | "grafico"
}

const axisProps = {
  axisLine: { stroke: "#333", strokeWidth: 2 },
  tickLine: { stroke: "#333", strokeWidth: 1 },
}

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
}

export function SezioneRisultatiPeriodo({
  risultatiPerPeriodo,
  risultatiPerPeriodoSDLY,
  risultatiPerPeriodoLY,
  confrontoSDLY,
  confrontoLY,
  visualizzazioneDati,
}: SezioneRisultatiPeriodoProps) {
  return (
    <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b-2 border-secondary-200">
        <CardTitle className="text-primary">Risultati per Periodo</CardTitle>
      </CardHeader>
      <CardContent>
        {visualizzazioneDati === "grafico" ? (
          <div className="space-y-8">
            {/* Notti Prenotate per periodo */}
            <div>
              <h3 className={chartStyle.title}>Notti Prenotate per Periodo</h3>
              <div className={chartStyle.container}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={risultatiPerPeriodo.map((periodo, index) => ({
                      periodo: periodo.periodo,
                      "RN (CY)": periodo.nottiPrenotate,
                      "RN (SDLY)": risultatiPerPeriodoSDLY[index]?.nottiPrenotate ?? 0,
                      "RN (LY)": risultatiPerPeriodoLY[index]?.nottiPrenotate ?? 0,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
                    <Bar dataKey="RN (CY)" name="RN (CY)" fill={chartColors.cy} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="RN (LY)" name="RN (LY)" fill={chartColors.ly} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="RN (SDLY)" name="RN (SDLY)" fill={chartColors.sdly} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fatturato per periodo */}
            <div>
              <h3 className={chartStyle.title}>Fatturato per Periodo</h3>
              <div className={chartStyle.container}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={risultatiPerPeriodo.map((periodo, index) => ({
                      periodo: periodo.periodo,
                      "Fatturato (CY)": periodo.fatturato,
                      "Fatturato (SDLY)": risultatiPerPeriodoSDLY[index]?.fatturato ?? 0,
                      "Fatturato (LY)": risultatiPerPeriodoLY[index]?.fatturato ?? 0,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
                    <Bar dataKey="Fatturato (CY)" name="Fatturato (CY)" fill={chartColors.cy} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="Fatturato (LY)" name="Fatturato (LY)" fill={chartColors.ly} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="Fatturato (SDLY)" name="Fatturato (SDLY)" fill={chartColors.sdly} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tasso Occupazione per periodo */}
            <div>
              <h3 className={chartStyle.title}>Tasso di Occupazione per Periodo</h3>
              <div className={chartStyle.container}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={risultatiPerPeriodo.map((periodo, index) => ({
                      periodo: periodo.periodo,
                      "Occupazione (CY)": periodo.tassoOccupazione,
                      "Occupazione (SDLY)": risultatiPerPeriodoSDLY[index]?.tassoOccupazione ?? 0,
                      "Occupazione (LY)": risultatiPerPeriodoLY[index]?.tassoOccupazione ?? 0,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} {...axisProps} />
                    <YAxis domain={[0, 100]} {...axisProps} />
                    <Tooltip formatter={(value) => formatPercent(Number(value))} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
                    <Bar dataKey="Occupazione (CY)" name="Occupazione (CY)" fill={chartColors.cy} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="Occupazione (LY)" name="Occupazione (LY)" fill={chartColors.ly} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="Occupazione (SDLY)" name="Occupazione (SDLY)" fill={chartColors.sdly} radius={[8, 8, 0, 0]} barSize={20} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary-50">
                <TableHead className="font-bold">Periodo</TableHead>
                <TableHead className="text-right font-bold">Notti Disponibili</TableHead>
                <TableHead className="text-right font-bold">Notti Prenotate</TableHead>
                <TableHead className="text-right font-bold">Fatturato</TableHead>
                <TableHead className="text-right font-bold">ADR</TableHead>
                <TableHead className="text-right font-bold">Tasso Occupazione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risultatiPerPeriodo.map((r, index) => (
                <TableRow key={index} className="hover:bg-secondary-50">
                  <TableCell className="font-medium">{r.periodo}</TableCell>
                  <TableCell className="text-right">{formatNumber(r.nottiDisponibili)}</TableCell>
                  <TableCell className="text-right">{formatNumber(r.nottiPrenotate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.fatturato)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.adr)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.tassoOccupazione)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
