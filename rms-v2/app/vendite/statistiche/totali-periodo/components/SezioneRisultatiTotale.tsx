"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import type { RisultatoType, RisultatoPerPeriodoType } from "../types"
import {
  formatCurrency, formatNumber, formatPercent,
  calcolaVariazione, getVariazioneClass,
  chartColors, chartStyle,
} from "../utils"

interface SezioneRisultatiTotaleProps {
  risultato: RisultatoType
  risultatoSDLY: RisultatoType | null
  risultatoLY: RisultatoType | null
  confrontoSDLY: boolean
  confrontoLY: boolean
  visualizzazioneDati: "tabella" | "grafico"
  risultatiPerPeriodo: RisultatoPerPeriodoType[]
  risultatiPerPeriodoSDLY: RisultatoPerPeriodoType[]
  risultatiPerPeriodoLY: RisultatoPerPeriodoType[]
  calcolaDistribuzione: (indicatore: string) => void
  setShowDistribuzioneDialog: (v: boolean) => void
}

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
}

export function SezioneRisultatiTotale({
  risultato,
  risultatoSDLY,
  risultatoLY,
  confrontoSDLY,
  confrontoLY,
  visualizzazioneDati,
  risultatiPerPeriodo,
  risultatiPerPeriodoSDLY,
  risultatiPerPeriodoLY,
  calcolaDistribuzione,
  setShowDistribuzioneDialog,
}: SezioneRisultatiTotaleProps) {
  const axisProps = {
    axisLine: { stroke: "#333", strokeWidth: 2 },
    tickLine: { stroke: "#333", strokeWidth: 1 },
  }

  return (
    <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b-2 border-secondary-200">
        <CardTitle className="text-primary">Risultati Totali</CardTitle>
      </CardHeader>
      <CardContent>
        {visualizzazioneDati === "grafico" ? (
          <div className="space-y-8">
            {/* Grafico Notti Disponibili e Prenotate */}
            <div>
              <h3 className={chartStyle.title}>Notti Disponibili e Prenotate</h3>
              <div className={chartStyle.container}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Attuale", nottiDisponibili: risultato.nottiDisponibili, nottiPrenotate: risultato.nottiPrenotate },
                      ...(confrontoSDLY && risultatoSDLY ? [{ name: "SDLY", nottiDisponibili: risultatoSDLY.nottiDisponibili, nottiPrenotate: risultatoSDLY.nottiPrenotate }] : []),
                      ...(confrontoLY && risultatoLY ? [{ name: "LY", nottiDisponibili: risultatoLY.nottiDisponibili, nottiPrenotate: risultatoLY.nottiPrenotate }] : []),
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} labelFormatter={(label) => `Periodo: ${label}`} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar dataKey="nottiDisponibili" name="Notti Disponibili" fill={chartColors.nottiDisponibili} radius={[8, 8, 0, 0]} barSize={30} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar dataKey="nottiPrenotate" name="Notti Prenotate" fill={chartColors.nottiPrenotate} radius={[8, 8, 0, 0]} barSize={30} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafico Fatturato */}
            <div>
              <h3 className={chartStyle.title}>Fatturato</h3>
              <div className={chartStyle.container}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Attuale", fatturato: risultato.fatturato },
                      ...(confrontoSDLY && risultatoSDLY ? [{ name: "SDLY", fatturato: risultatoSDLY.fatturato }] : []),
                      ...(confrontoLY && risultatoLY ? [{ name: "LY", fatturato: risultatoLY.fatturato }] : []),
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label) => `Periodo: ${label}`} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar dataKey="fatturato" name="Fatturato" fill={chartColors.fatturato} radius={[8, 8, 0, 0]} barSize={40} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafico ADR e Tasso Occupazione */}
            <div>
              <h3 className={chartStyle.title}>ADR e Tasso di Occupazione</h3>
              <div className={chartStyle.container}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Attuale", adr: risultato.adr, tassoOccupazione: risultato.tassoOccupazione },
                      ...(confrontoSDLY && risultatoSDLY ? [{ name: "SDLY", adr: risultatoSDLY.adr, tassoOccupazione: risultatoSDLY.tassoOccupazione }] : []),
                      ...(confrontoLY && risultatoLY ? [{ name: "LY", adr: risultatoLY.adr, tassoOccupazione: risultatoLY.tassoOccupazione }] : []),
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis yAxisId="left" orientation="left" {...axisProps} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} {...axisProps} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "adr") return formatCurrency(Number(value))
                        if (name === "tassoOccupazione") return formatPercent(Number(value))
                        return value
                      }}
                      labelFormatter={(label) => `Periodo: ${label}`}
                      contentStyle={tooltipStyle}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar yAxisId="left" dataKey="adr" name="ADR" fill={chartColors.adr} radius={[8, 8, 0, 0]} barSize={30} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                    <Bar yAxisId="right" dataKey="tassoOccupazione" name="Tasso Occupazione" fill={chartColors.tassoOccupazione} radius={[8, 8, 0, 0]} barSize={30} style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {risultatiPerPeriodo.length > 0 && (
              <div>
                <h3 className={chartStyle.title}>Andamento Settimanale - Notti Prenotate</h3>
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
            )}
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-secondary-50">
                <TableHead className="font-bold">Indicatore</TableHead>
                <TableHead className="text-right font-bold">Valore</TableHead>
                {confrontoSDLY && risultatoSDLY && (
                  <>
                    <TableHead className="text-right font-bold">SDLY</TableHead>
                    <TableHead className="text-right font-bold">Variazione</TableHead>
                  </>
                )}
                {confrontoLY && risultatoLY && (
                  <>
                    <TableHead className="text-right font-bold">LY (7 Set)</TableHead>
                    <TableHead className="text-right font-bold">Variazione</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Notti Disponibili", key: "nottiDisponibili" as const, fmt: formatNumber, indicatore: "Notti Disponibili" },
                { label: "Notti Prenotate", key: "nottiPrenotate" as const, fmt: formatNumber, indicatore: "Notti Prenotate" },
                { label: "Fatturato Totale", key: "fatturato" as const, fmt: formatCurrency, indicatore: "Fatturato Totale" },
                { label: "ADR", key: "adr" as const, fmt: formatCurrency, indicatore: "ADR" },
                { label: "Tasso di Occupazione", key: "tassoOccupazione" as const, fmt: formatPercent, indicatore: "Tasso di Occupazione" },
              ].map(({ label, key, fmt, indicatore }) => (
                <TableRow key={key} className="hover:bg-secondary-50">
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell
                    className="text-right cursor-pointer hover:text-primary hover:underline"
                    onClick={() => {
                      calcolaDistribuzione(indicatore)
                      setShowDistribuzioneDialog(true)
                    }}
                  >
                    {fmt(risultato[key])}
                  </TableCell>
                  {confrontoSDLY && risultatoSDLY && (
                    <>
                      <TableCell className="text-right">{fmt(risultatoSDLY[key])}</TableCell>
                      <TableCell className={`text-right ${getVariazioneClass(calcolaVariazione(risultato[key], risultatoSDLY[key]))}`}>
                        {formatPercent(calcolaVariazione(risultato[key], risultatoSDLY[key]))}
                      </TableCell>
                    </>
                  )}
                  {confrontoLY && risultatoLY && (
                    <>
                      <TableCell className="text-right">{fmt(risultatoLY[key])}</TableCell>
                      <TableCell className={`text-right ${getVariazioneClass(calcolaVariazione(risultato[key], risultatoLY[key]))}`}>
                        {formatPercent(calcolaVariazione(risultato[key], risultatoLY[key]))}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
