"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import {
  getHotelPerStrategiaPrezzi,
  getStagioniPerHotel,
  getTipiCamerePerHotel,
  getSettimanePerStagione,
  createPrezziStoricoMultipli,
  type HotelStrategia,
  type StagioneStrategia,
  type TipoCameraStrategia,
  type SettimanaStrategia,
} from "@/lib/services/strategia-prezzi-service"
import { formatCurrency } from "@/lib/utils"

// Interfaccia per i prezzi delle camere
interface CameraPrezzo {
  id: string
  nome: string
  prezzo: string
}

export function FormCaricaStorico() {
  const { toast } = useToast()

  // Stati per i dati
  const [hotels, setHotels] = useState<HotelStrategia[]>([])
  const [stagioni, setStagioni] = useState<StagioneStrategia[]>([])
  const [tipiCamere, setTipiCamere] = useState<TipoCameraStrategia[]>([])
  const [settimane, setSettimane] = useState<SettimanaStrategia[]>([])

  // Stati per il form
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [selectedStagione, setSelectedStagione] = useState<string>("")
  const [selectedCamere, setSelectedCamere] = useState<CameraPrezzo[]>([])
  const [selectedSettimana, setSelectedSettimana] = useState<string>("")
  const [validoDa, setValidoDa] = useState<Date | undefined>(new Date())
  const [validoA, setValidoA] = useState<Date | undefined>(undefined)

  // Stati per loading e feedback
  const [loading, setLoading] = useState(false)
  const [loadingHotels, setLoadingHotels] = useState(true)
  const [loadingStagioni, setLoadingStagioni] = useState(false)
  const [loadingCamere, setLoadingCamere] = useState(false)
  const [loadingSettimane, setLoadingSettimane] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Carica gli hotel all'avvio
  useEffect(() => {
    async function fetchHotels() {
      try {
        setLoadingHotels(true)
        const data = await getHotelPerStrategiaPrezzi()
        setHotels(data)
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile caricare gli hotel",
          variant: "destructive",
        })
      } finally {
        setLoadingHotels(false)
      }
    }

    fetchHotels()
  }, [toast])

  // Carica stagioni quando cambia hotel
  useEffect(() => {
    if (selectedHotel) {
      async function fetchStagioni() {
        try {
          setLoadingStagioni(true)
          const data = await getStagioniPerHotel(selectedHotel)
          setStagioni(data)
          setSelectedStagione("")
          setSelectedCamere([])
          setSelectedSettimana("")
        } catch (error) {
          toast({
            title: "Errore",
            description: "Impossibile caricare le stagioni",
            variant: "destructive",
          })
        } finally {
          setLoadingStagioni(false)
        }
      }

      fetchStagioni()
    } else {
      setStagioni([])
      setSelectedStagione("")
    }
  }, [selectedHotel, toast])

  // Carica tipi camera quando cambia hotel
  useEffect(() => {
    if (selectedHotel) {
      async function fetchTipiCamere() {
        try {
          setLoadingCamere(true)
          const data = await getTipiCamerePerHotel(selectedHotel)
          setTipiCamere(data)
          setSelectedCamere([])
        } catch (error) {
          toast({
            title: "Errore",
            description: "Impossibile caricare i tipi camera",
            variant: "destructive",
          })
        } finally {
          setLoadingCamere(false)
        }
      }

      fetchTipiCamere()
    } else {
      setTipiCamere([])
      setSelectedCamere([])
    }
  }, [selectedHotel, toast])

  // Carica settimane quando cambia stagione
  useEffect(() => {
    if (selectedStagione) {
      const stagione = stagioni.find((s) => s.id === selectedStagione)
      if (stagione) {
        async function fetchSettimane() {
          try {
            setLoadingSettimane(true)
            const data = await getSettimanePerStagione(stagione.anno)
            setSettimane(data)
            setSelectedSettimana("")
          } catch (error) {
            toast({
              title: "Errore",
              description: "Impossibile caricare le settimane",
              variant: "destructive",
            })
          } finally {
            setLoadingSettimane(false)
          }
        }

        fetchSettimane()
      }
    } else {
      setSettimane([])
      setSelectedSettimana("")
    }
  }, [selectedStagione, stagioni, toast])

  // Gestisce il toggle delle camere selezionate
  const toggleCamera = (camera: TipoCameraStrategia) => {
    setSelectedCamere((prev) => {
      const isSelected = prev.some((c) => c.id === camera.id)

      if (isSelected) {
        // Rimuovi la camera se già selezionata
        return prev.filter((c) => c.id !== camera.id)
      } else {
        // Aggiungi la camera con prezzo vuoto
        return [...prev, { id: camera.id, nome: camera.nome, prezzo: "" }]
      }
    })
  }

  // Aggiorna il prezzo di una camera specifica
  const updateCameraPrezzo = (cameraId: string, prezzo: string) => {
    setSelectedCamere((prev) =>
      prev.map((camera) => {
        if (camera.id === cameraId) {
          return { ...camera, prezzo }
        }
        return camera
      }),
    )
  }

  // Gestisce il submit del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    if (!selectedHotel || !selectedStagione || selectedCamere.length === 0 || !selectedSettimana || !validoDa) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori tranne 'Valido fino a' che è opzionale",
        variant: "destructive",
      })
      return
    }

    // Verifica che tutte le camere abbiano un prezzo valido
    const camereInvalide = selectedCamere.filter(
      (camera) => !camera.prezzo || isNaN(Number.parseFloat(camera.prezzo)) || Number.parseFloat(camera.prezzo) <= 0,
    )

    if (camereInvalide.length > 0) {
      toast({
        title: "Errore",
        description: `${camereInvalide.length} tipologie di camera hanno prezzi non validi o mancanti`,
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const stagione = stagioni.find((s) => s.id === selectedStagione)
      if (!stagione) {
        throw new Error("Stagione non valida")
      }

      // Formatta le date per l'API
      const validoDaFormatted = format(validoDa, "yyyy-MM-dd")
      const validoAFormatted = validoA ? format(validoA, "yyyy-MM-dd") : null

      // Crea un array di richieste per ogni camera selezionata
      const richieste = selectedCamere.map((camera) => ({
        idHotel: selectedHotel,
        stagione: stagione.stagione,
        cameraId: camera.id,
        nomeCamera: camera.nome,
        prezzo: Number.parseFloat(camera.prezzo),
        settimanaId: selectedSettimana,
        validoDa: validoDaFormatted,
        validoA: validoAFormatted,
      }))

      const risultato = await createPrezziStoricoMultipli(richieste)

      // Calcola il totale dei prezzi
      const totaleImporto = selectedCamere.reduce((acc, camera) => acc + Number.parseFloat(camera.prezzo || "0"), 0)

      // Mostra messaggio di successo
      setSuccessMessage(
        `Prezzi storici creati con successo per ${selectedCamere.length} tipologie di camera per un totale di ${formatCurrency(totaleImporto)}`,
      )

      toast({
        title: "Successo",
        description: `Creati ${risultato.length} prezzi storici`,
      })

      // Reset parziale del form
      setSelectedCamere([])
    } catch (error) {
      console.error("Errore durante la creazione dei prezzi storici:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare i prezzi storici. Verifica i dati e riprova.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-primary">Carica Prezzi Storici</CardTitle>
        <CardDescription>
          Definisci prezzi storici per più tipologie di camera con date di validità personalizzate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Operazione completata</AlertTitle>
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selettore Hotel */}
          <div className="space-y-2">
            <Label htmlFor="hotel">Hotel</Label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel} disabled={loadingHotels}>
              <SelectTrigger>
                <SelectValue placeholder={loadingHotels ? "Caricamento..." : "Seleziona un hotel"} />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selettore Stagione */}
          <div className="space-y-2">
            <Label htmlFor="stagione">Stagione</Label>
            <Select
              value={selectedStagione}
              onValueChange={setSelectedStagione}
              disabled={!selectedHotel || loadingStagioni}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedHotel
                      ? "Prima seleziona un hotel"
                      : loadingStagioni
                        ? "Caricamento..."
                        : "Seleziona una stagione"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {stagioni.map((stagione) => (
                  <SelectItem key={stagione.id} value={stagione.id}>
                    {stagione.stagione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selettore Settimana */}
          <div className="space-y-2">
            <Label htmlFor="settimana">Settimana di Soggiorno</Label>
            <Select
              value={selectedSettimana}
              onValueChange={setSelectedSettimana}
              disabled={!selectedStagione || loadingSettimane}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedStagione
                      ? "Prima seleziona una stagione"
                      : loadingSettimane
                        ? "Caricamento..."
                        : "Seleziona una settimana"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {settimane.map((settimana) => (
                  <SelectItem key={settimana.id} value={settimana.id}>
                    {settimana.nome} ({format(new Date(settimana.inizio), "dd/MM/yyyy")} -{" "}
                    {format(new Date(settimana.fine), "dd/MM/yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input manuale per Valido Da */}
          <div className="space-y-2">
            <Label htmlFor="validoDa">Valido da</Label>
            <Input
              id="validoDa"
              type="date"
              value={validoDa ? format(validoDa, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setValidoDa(new Date(e.target.value))
                } else {
                  setValidoDa(undefined)
                }
              }}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Input manuale per Valido A (opzionale) */}
          <div className="space-y-2">
            <Label htmlFor="validoA">Valido fino a (opzionale)</Label>
            <Input
              id="validoA"
              type="date"
              value={validoA ? format(validoA, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setValidoA(new Date(e.target.value))
                } else {
                  setValidoA(undefined)
                }
              }}
              disabled={loading}
              className="w-full"
              min={validoDa ? format(validoDa, "yyyy-MM-dd") : undefined}
            />
          </div>

          {/* Selettore Multiplo Tipologie Camera con Prezzi Individuali */}
          <div className="space-y-2">
            <Label>Tipologie Camera e Prezzi</Label>
            <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
              {loadingCamere ? (
                <p className="text-sm text-muted-foreground">Caricamento...</p>
              ) : tipiCamere.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {!selectedHotel ? "Prima seleziona un hotel" : "Nessuna tipologia camera disponibile"}
                </p>
              ) : (
                <div className="space-y-4">
                  {tipiCamere.map((camera) => {
                    const isSelected = selectedCamere.some((c) => c.id === camera.id)
                    const selectedCamera = selectedCamere.find((c) => c.id === camera.id)

                    return (
                      <div key={camera.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`camera-${camera.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleCamera(camera)}
                          />
                          <Label htmlFor={`camera-${camera.id}`} className="text-sm cursor-pointer flex-1">
                            {camera.nome}
                          </Label>
                        </div>

                        {isSelected && (
                          <div className="ml-6 flex items-center space-x-2">
                            <Label htmlFor={`prezzo-${camera.id}`} className="text-xs w-16">
                              Prezzo (€):
                            </Label>
                            <Input
                              id={`prezzo-${camera.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={selectedCamera?.prezzo || ""}
                              onChange={(e) => updateCameraPrezzo(camera.id, e.target.value)}
                              placeholder="Inserisci il prezzo"
                              className="w-32"
                              disabled={loading}
                            />
                            {selectedCamera?.prezzo && !isNaN(Number.parseFloat(selectedCamera.prezzo)) && (
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(Number.parseFloat(selectedCamera.prezzo))}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {selectedCamere.length > 0 && (
              <p className="text-sm text-muted-foreground">{selectedCamere.length} tipologie selezionate</p>
            )}
          </div>

          {/* Pulsante Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creazione in corso..." : "Crea Prezzi Storici"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
