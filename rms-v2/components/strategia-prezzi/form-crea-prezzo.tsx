"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import {
  getHotelPerStrategiaPrezzi,
  getStagioniPerHotel,
  getTipiCamerePerHotel,
  getSettimanePerStagione,
  createPrezzoFinale,
  type HotelStrategia,
  type StagioneStrategia,
  type TipoCameraStrategia,
  type SettimanaStrategia,
} from "@/lib/services/strategia-prezzi-service"
import { formatCurrency } from "@/lib/utils"

export function FormCreaPrezzo() {
  const { toast } = useToast()

  // Stati per i dati
  const [hotels, setHotels] = useState<HotelStrategia[]>([])
  const [stagioni, setStagioni] = useState<StagioneStrategia[]>([])
  const [tipiCamere, setTipiCamere] = useState<TipoCameraStrategia[]>([])
  const [settimane, setSettimane] = useState<SettimanaStrategia[]>([])

  // Stati per il form
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [selectedStagione, setSelectedStagione] = useState<string>("")
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [selectedSettimana, setSelectedSettimana] = useState<string>("")
  const [prezzo, setPrezzo] = useState<string>("")

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
          setSelectedCamera("")
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
          setSelectedCamera("")
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
      setSelectedCamera("")
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

  // Gestisce il submit del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    if (!selectedHotel || !selectedStagione || !selectedCamera || !selectedSettimana || !prezzo) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      })
      return
    }

    const prezzoNumerico = Number.parseFloat(prezzo)
    if (isNaN(prezzoNumerico) || prezzoNumerico <= 0) {
      toast({
        title: "Errore",
        description: "Il prezzo deve essere un numero valido maggiore di zero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const stagione = stagioni.find((s) => s.id === selectedStagione)
      const camera = tipiCamere.find((c) => c.id === selectedCamera)
      const settimana = settimane.find((s) => s.id === selectedSettimana)

      if (!stagione || !camera || !settimana) {
        throw new Error("Dati non validi")
      }

      const hotelNome = hotels.find((h) => h.id === selectedHotel)?.nome || "hotel"

      await createPrezzoFinale({
        idHotel: selectedHotel,
        stagione: stagione.stagione,
        cameraId: selectedCamera,
        nomeCamera: camera.nome,
        prezzo: prezzoNumerico,
        settimanaId: selectedSettimana,
      })

      // Mostra messaggio di successo
      setSuccessMessage(
        `Prezzo di ${formatCurrency(prezzoNumerico)} per ${camera.nome} (${hotelNome}) nella settimana ${settimana.nome} creato con successo!`,
      )

      toast({
        title: "Successo",
        description: "Prezzo creato con successo",
      })

      // Reset form parziale
      setPrezzo("")
      setSelectedSettimana("")
    } catch (error) {
      console.error("Errore durante la creazione del prezzo:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare il prezzo. Verifica i dati e riprova.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-primary">Crea Nuovo Prezzo</CardTitle>
        <CardDescription>
          Definisci il prezzo per una tipologia di camera in una specifica settimana di soggiorno
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

          {/* Selettore Tipo Camera */}
          <div className="space-y-2">
            <Label htmlFor="camera">Tipologia Camera</Label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={!selectedHotel || loadingCamere}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedHotel
                      ? "Prima seleziona un hotel"
                      : loadingCamere
                        ? "Caricamento..."
                        : "Seleziona una tipologia camera"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tipiCamere.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.nome}
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
                    {settimana.nome} ({new Date(settimana.inizio).toLocaleDateString("it-IT")} -{" "}
                    {new Date(settimana.fine).toLocaleDateString("it-IT")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input Prezzo */}
          <div className="space-y-2">
            <Label htmlFor="prezzo">Prezzo (€)</Label>
            <Input
              id="prezzo"
              type="number"
              step="0.01"
              min="0"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              placeholder="Inserisci il prezzo"
              disabled={loading}
            />
            {prezzo && !isNaN(Number.parseFloat(prezzo)) && (
              <p className="text-sm text-muted-foreground">Prezzo: {formatCurrency(Number.parseFloat(prezzo))}</p>
            )}
          </div>

          {/* Pulsante Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creazione in corso..." : "Crea Prezzo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
