"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabellaOpzioni } from "@/components/opzioni-2026/tabella-opzioni"
import { StatisticheOpzioni } from "@/components/opzioni-2026/statistiche-opzioni"
import { getOpzioni2026Lista, getOpzioni2026Statistiche } from "@/lib/services/opzioni-2026-service"
import type { Opzione2026, Statistica2026 } from "@/lib/services/opzioni-2026-service"
import { Download } from "lucide-react"

interface Hotel {
  id: string
  nome: string
}

export default function Opzioni2026Page() {
  const router = useRouter()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id_hotel: "",
    nome: "",
    cellulare: "",
    email: "",
    note: "",
  })

  const [opzioniLista, setOpzioniLista] = useState<Opzione2026[]>([])
  const [statistiche, setStatistiche] = useState<Statistica2026[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Carica la lista degli hotel
  useEffect(() => {
    async function fetchHotels() {
      const { data, error } = await supabase.from("hotel").select("id, nome").order("nome")

      if (error) {
        console.error("Errore nel caricamento degli hotel:", error)
        toast({
          title: "Errore",
          description: "Impossibile caricare la lista degli hotel",
          variant: "destructive",
        })
        return
      }

      if (data) {
        setHotels(data)
      }
    }

    fetchHotels()
    fetchOpzioniData()
  }, [])

  // Carica i dati delle opzioni e statistiche
  async function fetchOpzioniData() {
    setLoadingData(true)
    try {
      const [listaData, statsData] = await Promise.all([getOpzioni2026Lista(), getOpzioni2026Statistiche()])

      setOpzioniLista(listaData)
      setStatistiche(statsData)
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati delle opzioni",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  // Gestisce i cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Gestisce il cambiamento del select dell'hotel
  const handleHotelChange = (value: string) => {
    setFormData((prev) => ({ ...prev, id_hotel: value }))
  }

  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validazione
      if (!formData.id_hotel || !formData.nome || !formData.cellulare || !formData.email) {
        toast({
          title: "Errore di validazione",
          description: "Tutti i campi sono obbligatori tranne le note",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Inserisce i dati nella tabella
      const { error } = await supabase.from("opzioni 2026").insert([
        {
          id_hotel: formData.id_hotel,
          nome: formData.nome,
          cellulare: formData.cellulare, // Ora inviamo il cellulare come testo
          email: formData.email,
          note: formData.note,
        },
      ])

      if (error) {
        console.error("Errore nell'inserimento dei dati:", error)
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Successo",
          description: "Opzione 2026 registrata con successo",
        })

        // Reset del form
        setFormData({
          id_hotel: "",
          nome: "",
          cellulare: "",
          email: "",
          note: "",
        })

        // Ricarica i dati
        fetchOpzioniData()
      }
    } catch (error) {
      console.error("Errore:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio del form",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = () => {
    if (opzioniLista.length === 0) {
      toast({
        title: "Nessun dato",
        description: "Non ci sono opzioni da esportare",
        variant: "destructive",
      })
      return
    }

    // Prepara i dati per l'export
    const exportData = opzioniLista.map((opzione) => {
      const hotel = hotels.find((h) => h.id === opzione.id_hotel)
      return {
        Hotel: hotel?.nome || "N/A",
        Nome: opzione.nome,
        Cellulare: opzione.cellulare,
        Email: opzione.email,
        Note: opzione.note || "",
        "Data Registrazione": new Date(opzione.created_at).toLocaleDateString("it-IT"),
      }
    })

    // Crea il CSV
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            // Escape virgole e virgolette nel CSV
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(","),
      ),
    ].join("\n")

    // Crea e scarica il file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `opzioni-2026-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export completato",
      description: "Il file è stato scaricato con successo",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="nuovo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nuovo">Nuova Opzione</TabsTrigger>
          <TabsTrigger value="lista">Lista Opzioni</TabsTrigger>
          <TabsTrigger value="statistiche">Statistiche</TabsTrigger>
        </TabsList>

        <TabsContent value="nuovo">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="bg-primary-50">
              <CardTitle className="text-2xl text-primary-700">Registrazione Opzioni 2026</CardTitle>
              <CardDescription>Inserisci i dati per registrare una nuova opzione per la stagione 2026</CardDescription>
              <div className="mt-2">
                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                  <li>Se utente chiede camera in particolare, scrivere nelle note;</li>
                  <li>Se utente richiede più hotel, scrivere le strutture aggiuntive nelle note;</li>
                  <li>
                    Se utente vuole cambiare mail, segnate quella nuova nelle note ma usate sempre la mail della
                    prenotazione in corso per il campo email.
                  </li>
                </ul>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="id_hotel">Hotel</Label>
                  <Select value={formData.id_hotel} onValueChange={handleHotelChange}>
                    <SelectTrigger id="id_hotel">
                      <SelectValue placeholder="Seleziona un hotel" />
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

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Inserisci nome e cognome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cellulare">Cellulare</Label>
                  <Input
                    id="cellulare"
                    name="cellulare"
                    value={formData.cellulare}
                    onChange={handleChange}
                    placeholder="Inserisci il numero di cellulare (es. +39 123 456789 o WhatsApp)"
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Inserisci l'indirizzo email"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (opzionale)</Label>
                  <Textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Inserisci eventuali note"
                    rows={3}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t p-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annulla
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700">
                  {loading ? "Registrazione in corso..." : "Registra Opzione"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          {loadingData ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p>Caricamento dati...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Lista Opzioni 2026</h2>
                <Button
                  onClick={handleExportToExcel}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Scarica Excel
                </Button>
              </div>
              <TabellaOpzioni opzioni={opzioniLista} hotels={hotels} onDataChange={fetchOpzioniData} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistiche">
          {loadingData ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p>Caricamento statistiche...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <StatisticheOpzioni statistiche={statistiche} />
          )}
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  )
}
