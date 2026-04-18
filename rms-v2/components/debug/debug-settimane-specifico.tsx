"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { debugSettimaneSpecifico, type DebugSettimaneStep } from "@/lib/services/debug-settimane-service"
import { Loader2, Calendar, Database, TrendingDown } from "lucide-react"

export function DebugSettimaneSpecifico() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugSettimaneStep[]>([])
  const [formData, setFormData] = useState({
    hotel: "SERE",
    camera: "Family Smile",
    settimana: "II Luglio",
    stagione: "sere_2025",
  })

  const handleDebug = async () => {
    setLoading(true)
    try {
      const data = await debugSettimaneSpecifico(formData.hotel, formData.camera, formData.settimana, formData.stagione)
      setResults(data)
    } catch (error) {
      console.error("Errore debug settimane:", error)
      alert(`Errore: ${error instanceof Error ? error.message : "Errore sconosciuto"}`)
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return <Database className="h-5 w-5 text-blue-500" />
      case 2:
        return <Calendar className="h-5 w-5 text-orange-500" />
      case 3:
        return <TrendingDown className="h-5 w-5 text-red-500" />
      case 4:
        return <Database className="h-5 w-5 text-purple-500" />
      default:
        return <Database className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Settimane - Analisi Specifica</CardTitle>
          <CardDescription>
            Analizza il problema della perdita di prenotazioni nel raggruppamento per settimana
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
            {loading ? "Analizzando..." : "🚀 Analizza Problema Settimane"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Analisi Dettagliata Settimane</CardTitle>
            <CardDescription>Capire perché da 57 prenotazioni si arriva a 28</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((step) => (
                <div key={step.step_number} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start gap-3">
                    {getStepIcon(step.step_number)}

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

                      {step.sample_data && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                          <strong>🔍 Dati dettagliati:</strong>
                          <div className="mt-2 font-mono text-xs break-all max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {step.sample_data.split(" | ").join("\n")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">🚨 Problema Identificato</h4>
                <div className="text-sm text-red-800 space-y-2">
                  <p>
                    <strong>Il problema è nel raggruppamento per settimana di prenotazione!</strong>
                  </p>
                  <p>
                    • Hai <strong>{results[0]?.count_result || 0} prenotazioni</strong> che hanno "II Luglio" nell'array
                    settimane (settimana di soggiorno)
                  </p>
                  <p>
                    • Ma quando raggruppi per <code>DATE_TRUNC('week', data_prenotazione)</code> (settimana di
                    prenotazione), ottieni solo <strong>{results[1]?.count_result || 0} settimane uniche</strong>
                  </p>
                  <p>
                    • Il risultato finale è <strong>{results[2]?.count_result || 0} prenotazioni</strong> perché molte
                    prenotazioni sono state fatte nella stessa settimana
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <strong>Soluzione:</strong> Non raggruppare per settimana di prenotazione, ma contare direttamente
                    le prenotazioni che hanno la settimana di soggiorno nell'array!
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
