"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { debugPrenotazioniStepByStep, type DebugStep } from "@/lib/services/debug-prenotazioni-service"
import { DebugSettimaneSpecifico } from "./debug-settimane-specifico"
import { Loader2, CheckCircle, Info, TrendingDown } from "lucide-react"

export function DebugPrenotazioniStepByStep() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugStep[]>([])
  const [formData, setFormData] = useState({
    hotel: "SERE",
    camera: "Family Smile",
    settimana: "II Luglio",
    stagione: "sere_2025",
  })

  const handleDebug = async () => {
    setLoading(true)
    try {
      const data = await debugPrenotazioniStepByStep(
        formData.hotel,
        formData.camera,
        formData.settimana,
        formData.stagione,
      )
      setResults(data)
    } catch (error) {
      console.error("Errore debug:", error)
      alert(`Errore: ${error instanceof Error ? error.message : "Errore sconosciuto"}`)
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (step: DebugStep, previousStep?: DebugStep) => {
    if (step.step_number === 1) return <Info className="h-5 w-5 text-blue-500" />

    if (!previousStep) return <CheckCircle className="h-5 w-5 text-green-500" />

    const reduction = previousStep.count_result - step.count_result
    if (reduction > 0) {
      return <TrendingDown className="h-5 w-5 text-red-500" />
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const getReductionInfo = (step: DebugStep, previousStep?: DebugStep) => {
    if (!previousStep) return null

    const reduction = previousStep.count_result - step.count_result
    if (reduction > 0) {
      const percentage = ((reduction / previousStep.count_result) * 100).toFixed(1)
      return (
        <div className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">
          ⚠️ Persi: {reduction} record ({percentage}%)
        </div>
      )
    }
    return <div className="text-green-600 text-sm">✅ Nessuna perdita</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generale" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generale">Debug Generale</TabsTrigger>
          <TabsTrigger value="settimane">🔥 Analisi Settimane</TabsTrigger>
        </TabsList>

        <TabsContent value="generale" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Debug Prenotazioni Step by Step</CardTitle>
              <CardDescription>
                Analizza dove si perdono le prenotazioni nel processo di filtraggio per capire perché da 57 si arriva a
                28
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotel">Hotel</Label>
                  <Input
                    id="hotel"
                    value={formData.hotel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hotel: e.target.value }))}
                    placeholder="es. SERE"
                  />
                </div>
                <div>
                  <Label htmlFor="camera">Camera</Label>
                  <Input
                    id="camera"
                    value={formData.camera}
                    onChange={(e) => setFormData((prev) => ({ ...prev, camera: e.target.value }))}
                    placeholder="es. Family Smile"
                  />
                </div>
                <div>
                  <Label htmlFor="settimana">Settimana</Label>
                  <Input
                    id="settimana"
                    value={formData.settimana}
                    onChange={(e) => setFormData((prev) => ({ ...prev, settimana: e.target.value }))}
                    placeholder="es. II Luglio"
                  />
                </div>
                <div>
                  <Label htmlFor="stagione">Stagione</Label>
                  <Input
                    id="stagione"
                    value={formData.stagione}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stagione: e.target.value }))}
                    placeholder="es. sere_2025"
                  />
                </div>
              </div>

              <Button onClick={handleDebug} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Analizzando..." : "🚀 Esegui Debug"}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📊 Risultati Debug</CardTitle>
                <CardDescription>
                  Tracciamento step-by-step del processo di filtraggio delle prenotazioni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((step, index) => {
                    const previousStep = index > 0 ? results[index - 1] : undefined
                    return (
                      <div key={step.step_number} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start gap-3">
                          {getStepIcon(step, previousStep)}

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">
                                Step {step.step_number}: {step.step_description}
                              </h4>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  step.count_result === 0
                                    ? "bg-red-100 text-red-800"
                                    : step.count_result < 30
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {step.count_result} risultati
                              </span>
                            </div>

                            {previousStep && <div className="mb-3">{getReductionInfo(step, previousStep)}</div>}

                            {step.sample_data && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                                <strong>🔍 Dati campione:</strong>
                                <div className="mt-1 font-mono text-xs break-all max-h-20 overflow-y-auto">
                                  {step.sample_data}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {results.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">📈 Riepilogo Analisi</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>
                        🎯 Prenotazioni iniziali: <strong>{results[0]?.count_result || 0}</strong>
                      </div>
                      <div>
                        🏁 Prenotazioni finali: <strong>{results[results.length - 1]?.count_result || 0}</strong>
                      </div>
                      <div>
                        📉 Perdita totale:{" "}
                        <strong className="text-red-700">
                          {(results[0]?.count_result || 0) - (results[results.length - 1]?.count_result || 0)} record (
                          {(
                            (((results[0]?.count_result || 0) - (results[results.length - 1]?.count_result || 0)) /
                              (results[0]?.count_result || 1)) *
                            100
                          ).toFixed(1)}
                          %)
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settimane" className="space-y-6">
          <DebugSettimaneSpecifico />
        </TabsContent>
      </Tabs>
    </div>
  )
}
