"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AndamentoPreventivi } from "./components/andamento-preventivi"
import { PressioneDomanda } from "./components/pressione-domanda"
import { PerformanceOperatori } from "./components/performance-operatori"
import { MappaDelCalore } from "./components/mappa-del-calore"

export default function DomandaProvvisorioPage() {
  const [activeTab, setActiveTab] = useState("andamento")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-700">Analisi Domanda TravelBrain</h1>
        <p className="mt-2 text-gray-600 italic">
          Analisi completa dei preventivi elaborati basata sui dati della view v_essenziale_preventivi2025. Monitora
          l'andamento della domanda nel tempo e le performance degli operatori.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="andamento">Andamento Preventivi</TabsTrigger>
          <TabsTrigger value="pressione">Pressione Domanda</TabsTrigger>
          <TabsTrigger value="operatori">Performance Operatori</TabsTrigger>
          <TabsTrigger value="heatmap">Mappa del Calore</TabsTrigger>
        </TabsList>

        <TabsContent value="andamento" className="mt-6">
          <AndamentoPreventivi />
        </TabsContent>

        <TabsContent value="pressione" className="mt-6">
          <PressioneDomanda />
        </TabsContent>

        <TabsContent value="operatori" className="mt-6">
          <PerformanceOperatori />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-6">
          <MappaDelCalore />
        </TabsContent>
      </Tabs>
    </div>
  )
}
