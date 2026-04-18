"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ScenarioPrevisionale } from "@/lib/services/analisi-predittiva-service"
import { formatCurrency } from "@/lib/utils"

interface ScenariPrevisionaliProps {
  scenari: Record<string, ScenarioPrevisionale[]>
  hotelNames: Record<string, string>
}

export function ScenariPrevisionali({ scenari, hotelNames }: ScenariPrevisionaliProps) {
  // Calcola i totali per ogni scenario
  const totali = {
    ottimistico: {
      occupazione: 0,
      fatturato: 0,
      adr: 0,
    },
    realistico: {
      occupazione: 0,
      fatturato: 0,
      adr: 0,
    },
    conservativo: {
      occupazione: 0,
      fatturato: 0,
      adr: 0,
    },
  }

  let conteggio = 0

  Object.entries(scenari).forEach(([hotelId, scenariHotel]) => {
    scenariHotel.forEach((scenario) => {
      totali[scenario.tipo].occupazione += scenario.occupazione_prevista
      totali[scenario.tipo].fatturato += scenario.fatturato_previsto
      totali[scenario.tipo].adr += scenario.adr_previsto
    })
    conteggio++
  })

  // Calcola le medie
  if (conteggio > 0) {
    totali.ottimistico.occupazione /= conteggio
    totali.realistico.occupazione /= conteggio
    totali.conservativo.occupazione /= conteggio

    totali.ottimistico.adr /= conteggio
    totali.realistico.adr /= conteggio
    totali.conservativo.adr /= conteggio
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Scenari Previsionali</CardTitle>
        <CardDescription>Proiezioni basate su diversi scenari di evoluzione delle prenotazioni</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="realistico">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ottimistico">Ottimistico</TabsTrigger>
            <TabsTrigger value="realistico">Realistico</TabsTrigger>
            <TabsTrigger value="conservativo">Conservativo</TabsTrigger>
          </TabsList>

          <TabsContent value="ottimistico" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Occupazione Media</h3>
                <p className="text-2xl font-bold text-green-900">{totali.ottimistico.occupazione.toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Fatturato Previsto</h3>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totali.ottimistico.fatturato)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">ADR Medio</h3>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totali.ottimistico.adr)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Questo scenario prevede un'accelerazione del ritmo di prenotazioni del 20% rispetto al trend attuale.
            </p>
          </TabsContent>

          <TabsContent value="realistico" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Occupazione Media</h3>
                <p className="text-2xl font-bold text-blue-900">{totali.realistico.occupazione.toFixed(1)}%</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Fatturato Previsto</h3>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totali.realistico.fatturato)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">ADR Medio</h3>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totali.realistico.adr)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Questo scenario prevede il mantenimento del ritmo di prenotazioni attuale fino alla stagione.
            </p>
          </TabsContent>

          <TabsContent value="conservativo" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-800">Occupazione Media</h3>
                <p className="text-2xl font-bold text-orange-900">{totali.conservativo.occupazione.toFixed(1)}%</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-800">Fatturato Previsto</h3>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(totali.conservativo.fatturato)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-800">ADR Medio</h3>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(totali.conservativo.adr)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Questo scenario prevede un rallentamento del ritmo di prenotazioni del 20% rispetto al trend attuale.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
