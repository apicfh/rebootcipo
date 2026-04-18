"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatNumber, formatPercent, calcolaVariazione, getVariazioneClass } from "../utils"

interface DialogDistribuzioneProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  indicatoreSelezionato: string
  loadingDistribuzione: boolean
  distribuzioneNotti: { tipo_camera: string; notti: number }[]
  distribuzioneSDLY: { tipo_camera: string; notti: number }[]
  distribuzioneLY: { tipo_camera: string; notti: number }[]
  confrontoSDLY: boolean
  confrontoLY: boolean
}

function formatValore(indicatore: string, valore: number) {
  if (indicatore === "Fatturato Totale" || indicatore === "ADR") return formatCurrency(valore)
  if (indicatore === "Tasso di Occupazione") return formatPercent(valore)
  return formatNumber(valore)
}

function formatTotale(indicatore: string, items: { tipo_camera: string; notti: number }[]) {
  const somma = items.reduce((sum, item) => sum + item.notti, 0)
  if (indicatore === "Fatturato Totale") return formatCurrency(somma)
  if (indicatore === "ADR") return formatCurrency(items.length > 0 ? somma / items.length : 0)
  if (indicatore === "Tasso di Occupazione") return formatPercent(items.length > 0 ? somma / items.length : 0)
  return formatNumber(somma)
}

export function DialogDistribuzione({
  open, onOpenChange,
  indicatoreSelezionato,
  loadingDistribuzione,
  distribuzioneNotti,
  distribuzioneSDLY,
  distribuzioneLY,
  confrontoSDLY,
  confrontoLY,
}: DialogDistribuzioneProps) {
  const colLabel =
    indicatoreSelezionato === "Fatturato Totale" ? "Fatturato"
    : indicatoreSelezionato === "ADR" ? "ADR"
    : indicatoreSelezionato === "Tasso di Occupazione" ? "Occupazione"
    : "Notti"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Distribuzione {indicatoreSelezionato} per Tipologia di Camera</DialogTitle>
        </DialogHeader>

        {loadingDistribuzione ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary-50">
                    <TableHead className="font-bold">Tipologia Camera</TableHead>
                    <TableHead className="text-right font-bold">{colLabel}</TableHead>
                    <TableHead className="text-right font-bold">%</TableHead>
                    {confrontoSDLY && distribuzioneSDLY.length > 0 && (
                      <>
                        <TableHead className="text-right font-bold">SDLY</TableHead>
                        <TableHead className="text-right font-bold">Variazione</TableHead>
                      </>
                    )}
                    {confrontoLY && distribuzioneLY.length > 0 && (
                      <>
                        <TableHead className="text-right font-bold">LY</TableHead>
                        <TableHead className="text-right font-bold">Variazione</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distribuzioneNotti.map((item, index) => {
                    const sdlyItem = distribuzioneSDLY.find((i) => i.tipo_camera === item.tipo_camera)
                    const lyItem = distribuzioneLY.find((i) => i.tipo_camera === item.tipo_camera)
                    const totale = distribuzioneNotti.reduce((sum, i) => sum + i.notti, 0)

                    return (
                      <TableRow key={index} className="hover:bg-secondary-50">
                        <TableCell>{item.tipo_camera}</TableCell>
                        <TableCell className="text-right">{formatValore(indicatoreSelezionato, item.notti)}</TableCell>
                        <TableCell className="text-right">{formatPercent((item.notti / totale) * 100)}</TableCell>
                        {confrontoSDLY && distribuzioneSDLY.length > 0 && (
                          <>
                            <TableCell className="text-right">
                              {sdlyItem ? formatValore(indicatoreSelezionato, sdlyItem.notti) : "-"}
                            </TableCell>
                            <TableCell className={`text-right ${sdlyItem ? getVariazioneClass(calcolaVariazione(item.notti, sdlyItem.notti)) : ""}`}>
                              {sdlyItem ? formatPercent(calcolaVariazione(item.notti, sdlyItem.notti)) : "-"}
                            </TableCell>
                          </>
                        )}
                        {confrontoLY && distribuzioneLY.length > 0 && (
                          <>
                            <TableCell className="text-right">
                              {lyItem ? formatValore(indicatoreSelezionato, lyItem.notti) : "-"}
                            </TableCell>
                            <TableCell className={`text-right ${lyItem ? getVariazioneClass(calcolaVariazione(item.notti, lyItem.notti)) : ""}`}>
                              {lyItem ? formatPercent(calcolaVariazione(item.notti, lyItem.notti)) : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Totale</TableCell>
                    <TableCell className="text-right font-bold">{formatTotale(indicatoreSelezionato, distribuzioneNotti)}</TableCell>
                    <TableCell className="text-right font-bold">100%</TableCell>
                    {confrontoSDLY && distribuzioneSDLY.length > 0 && (
                      <>
                        <TableCell className="text-right font-bold">{formatTotale(indicatoreSelezionato, distribuzioneSDLY)}</TableCell>
                        <TableCell className="text-right font-bold">-</TableCell>
                      </>
                    )}
                    {confrontoLY && distribuzioneLY.length > 0 && (
                      <>
                        <TableCell className="text-right font-bold">{formatTotale(indicatoreSelezionato, distribuzioneLY)}</TableCell>
                        <TableCell className="text-right font-bold">-</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <DialogFooter className="sm:justify-end mt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Chiudi</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
