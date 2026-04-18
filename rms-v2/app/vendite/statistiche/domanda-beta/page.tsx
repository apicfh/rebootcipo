"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, ChevronUp, ChevronDown, Filter, AlertCircle } from "lucide-react"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { supabase } from "@/lib/supabase/client"
import { format } from "date-fns"
import { VenditaCamere } from "./components/vendita-camere"
import { Operatori } from "./components/operatori"
import { Multirichiesta } from "./components/multirichiesta"
import { Anagrafica } from "./components/anagrafica"
import { Confronto } from "./components/confronto"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Tipi di dati
interface HotelType {
  id: string
  nome: string
}

export interface FilterState {
  hotels: string[]
  soggiorno: {
    from: Date | undefined
    to: Date | undefined
  }
  richiesta: {
    from: Date | undefined
    to: Date | undefined
  }
  stato: string
  confrontoAnnoPrec: boolean
  tipoPeriodo: "soggiorno" | "richiesta" | "entrambi"
}

export default function DomandaBetaPage() {
  // Stato per gli hotel disponibili
  const [hotels, setHotels] = useState<HotelType[]>([])

  // Stato per i filtri
  const [filters, setFilters] = useState<FilterState>({
    hotels: [],
    soggiorno: {
      from: new Date(2025, 4, 24), // 24 maggio 2025 (mese è 0-based, quindi 4 = maggio)
      to: new Date(2025, 8, 12), // 12 settembre 2025 (mese è 0-based, quindi 8 = settembre)
    },
    richiesta: {
      from: new Date(new Date().getFullYear(), 0, 1), // 1 gennaio dell'anno corrente
      to: new Date(),
    },
    stato: "tutti",
    confrontoAnnoPrec: false,
    tipoPeriodo: "soggiorno",
  })

  // Stato per i dati
  const [data, setData] = useState<any>({
    venditaCamere: {
      preventivi: [],
      conversionData: [],
    },
    operatori: [],
    multirichiesta: [],
    anagrafica: [],
    confronto: {
      corrente: [],
      precedente: [],
    },
  })

  // Stato per la visibilità dei filtri
  const [showFilters, setShowFilters] = useState<boolean>(true)

  // Stato per il caricamento
  const [loading, setLoading] = useState<boolean>(false)

  // Stato per la tab attiva
  const [activeTab, setActiveTab] = useState<string>("vendita-camere")

  // Stato per l'operatore selezionato
  const [selectedOperator, setSelectedOperator] = useState<string>("tutti")

  // Stato per gli errori
  const [error, setError] = useState<string | null>(null)

  // Stato per la palette attiva
  const [activePalette, setActivePalette] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cfh-palette") || "palette-4"
    }
    return "palette-4"
  })

  // Effetto per applicare la palette al body
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Rimuovi tutte le classi palette esistenti
      document.body.classList.remove("palette-1", "palette-2", "palette-3", "palette-4")
      // Aggiungi la classe della palette attiva
      document.body.classList.add(activePalette)
      // Salva la preferenza nel localStorage
      localStorage.setItem("cfh-palette", activePalette)
    }
  }, [activePalette])

  // Carica gli hotel all'avvio
  useEffect(() => {
    async function fetchHotels() {
      try {
        const { data, error } = await supabase.from("hotel").select("id, nome").order("nome")
        if (error) throw error
        setHotels(data || [])

        // Seleziona automaticamente tutti gli hotel
        if (data && data.length > 0) {
          setFilters((prev) => ({
            ...prev,
            hotels: data.map((h) => h.id),
          }))
        }
      } catch (err: any) {
        console.error("Errore nel caricamento degli hotel:", err)
        setError(err.message)
      }
    }

    fetchHotels()
  }, [])

  // Funzione per aggiornare i filtri
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Funzione per gestire la selezione/deselezione di tutti gli hotel
  const handleSelectAllHotels = (select: boolean) => {
    if (select) {
      updateFilter(
        "hotels",
        hotels.map((h) => h.id),
      )
    } else {
      updateFilter("hotels", [])
    }
  }

  // Funzione per gestire la selezione/deselezione di un singolo hotel
  const handleHotelSelection = (hotelId: string, selected: boolean) => {
    if (selected) {
      updateFilter("hotels", [...filters.hotels, hotelId])
    } else {
      updateFilter(
        "hotels",
        filters.hotels.filter((id) => id !== hotelId),
      )
    }
  }

  // Funzione per applicare i filtri - Adattata dalla sezione "Domanda"
  const applicaFiltri = async () => {
    // Verifica che ci siano date valide in base al tipo di periodo selezionato
    if (filters.tipoPeriodo === "soggiorno" || filters.tipoPeriodo === "entrambi") {
      if (!filters.soggiorno.from || !filters.soggiorno.to) {
        setError("Seleziona le date di soggiorno")
        return
      }
    }

    if (filters.tipoPeriodo === "richiesta" || filters.tipoPeriodo === "entrambi") {
      if (!filters.richiesta.from || !filters.richiesta.to) {
        setError("Seleziona le date di richiesta")
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Applicazione filtri per tab:", activeTab)

      // Gestione diversa in base alla tab attiva
      switch (activeTab) {
        case "operatori":
          await caricaDatiOperatori()
          break
        case "vendita-camere":
          await caricaDatiVenditaCamere()
          break
        case "multirichiesta":
          await caricaDatiMultirichiesta()
          break
        case "anagrafica":
          await caricaDatiAnagrafica()
          break
        case "vs":
          await caricaDatiConfronto()
          break
        default:
          console.warn("Tab non supportata:", activeTab)
      }
    } catch (err: any) {
      console.error("Errore nell'applicazione dei filtri:", err)
      setError(err.message || "Si è verificato un errore durante il caricamento dei dati")

      // Mostra un toast con l'errore
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Funzione per caricare i dati degli operatori
  const caricaDatiOperatori = async () => {
    try {
      // Prepara i parametri per la chiamata RPC
      const params = {
        p_data_inizio_soggiorno: filters.soggiorno.from ? format(filters.soggiorno.from, "yyyy-MM-dd") : null,
        p_data_fine_soggiorno: filters.soggiorno.to ? format(filters.soggiorno.to, "yyyy-MM-dd") : null,
        p_data_inizio_richiesta: filters.richiesta.from ? format(filters.richiesta.from, "yyyy-MM-dd") : null,
        p_data_fine_richiesta: filters.richiesta.to ? format(filters.richiesta.to, "yyyy-MM-dd") : null,
        p_hotels: filters.hotels.length > 0 ? filters.hotels : null,
        p_tipo_periodo: filters.tipoPeriodo,
      }

      console.log("Parametri RPC per operatori:", params)

      // Chiama la funzione RPC
      const { data, error } = await supabase.rpc("get_operatori_stats_complete", params)

      if (error) {
        console.error("Errore nella chiamata RPC get_operatori_stats_complete:", error)
        throw error
      }

      console.log("Dati operatori ricevuti:", data)

      // Aggiorna i dati
      setData((prev: any) => ({
        ...prev,
        operatori: data || [],
      }))

      if (!data) {
        setError("Nessun dato ricevuto per gli operatori")
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati degli operatori:", err)
      throw err
    }
  }

  // Funzione per caricare i dati di vendita camere
  const caricaDatiVenditaCamere = async () => {
    try {
      // 1. Carica i preventivi elaborati
      let queryPreventivi = supabase.from("preventivi_elaborati").select("*")

      // Applica filtri per hotel
      if (filters.hotels.length > 0) {
        queryPreventivi = queryPreventivi.in("id_hotel", filters.hotels)
      }

      // Applica filtri per date soggiorno o richiesta in base al tipo di periodo selezionato
      if (filters.tipoPeriodo === "soggiorno" || filters.tipoPeriodo === "entrambi") {
        if (filters.soggiorno.from && filters.soggiorno.to) {
          queryPreventivi = queryPreventivi
            .lte("data_arrivo", format(filters.soggiorno.to, "yyyy-MM-dd"))
            .gte("data_partenza", format(filters.soggiorno.from, "yyyy-MM-dd"))
        }
      }

      if (filters.tipoPeriodo === "richiesta" || filters.tipoPeriodo === "entrambi") {
        if (filters.richiesta.from && filters.richiesta.to) {
          const startDate = format(filters.richiesta.from, "yyyy-MM-dd")
          const endDate = format(filters.richiesta.to, "yyyy-MM-dd")

          // Se stiamo filtrando solo per data richiesta, usiamo una query OR
          if (filters.tipoPeriodo === "richiesta") {
            queryPreventivi = queryPreventivi.or(
              `data_elaborazione.gte.${startDate},data_elaborazione.lte.${endDate},data_creazione.gte.${startDate},data_creazione.lte.${endDate}`,
            )
          }
          // Se stiamo filtrando per entrambi, aggiungiamo le condizioni AND
          else {
            queryPreventivi = queryPreventivi.or(
              `and(data_elaborazione.gte.${startDate},data_elaborazione.lte.${endDate}),and(data_creazione.gte.${startDate},data_creazione.lte.${endDate})`,
            )
          }
        }
      }

      // Applica filtro per stato
      if (filters.stato !== "tutti") {
        const statoValue = mapStatoToValue(filters.stato)
        if (statoValue) {
          queryPreventivi = queryPreventivi.eq("stato", statoValue)
        }
      }

      const { data: preventiviData, error: preventiviError } = await queryPreventivi

      if (preventiviError) throw preventiviError

      console.log("Dati preventivi ricevuti:", preventiviData?.length || 0)

      // 2. Carica le prenotazioni
      let queryPrenotazioni = supabase.from("prenotazioni").select("*")

      // Applica filtri per hotel
      if (filters.hotels.length > 0) {
        queryPrenotazioni = queryPrenotazioni.in("id_hotel", filters.hotels)
      }

      // Applica filtri per date soggiorno o richiesta in base al tipo di periodo selezionato
      if (filters.tipoPeriodo === "soggiorno" || filters.tipoPeriodo === "entrambi") {
        if (filters.soggiorno.from && filters.soggiorno.to) {
          queryPrenotazioni = queryPrenotazioni
            .lte("arrivo", format(filters.soggiorno.to, "yyyy-MM-dd"))
            .gte("partenza", format(filters.soggiorno.from, "yyyy-MM-dd"))
        }
      }

      if (filters.tipoPeriodo === "richiesta" || filters.tipoPeriodo === "entrambi") {
        if (filters.richiesta.from && filters.richiesta.to) {
          const startDate = format(filters.richiesta.from, "yyyy-MM-dd")
          const endDate = format(filters.richiesta.to, "yyyy-MM-dd")

          // Se stiamo filtrando solo per data richiesta, usiamo una query OR
          if (filters.tipoPeriodo === "richiesta") {
            queryPrenotazioni = queryPrenotazioni.or(
              `data_prenotazione.gte.${startDate},data_prenotazione.lte.${endDate}`,
            )
          }
          // Se stiamo filtrando per entrambi, aggiungiamo le condizioni AND
          else {
            queryPrenotazioni = queryPrenotazioni.and(
              `data_prenotazione.gte.${startDate},data_prenotazione.lte.${endDate}`,
            )
          }
        }
      }

      // Applica filtro per stato
      if (filters.stato !== "tutti") {
        // Mappa gli stati per le prenotazioni
        let statoPrenotazione = null
        switch (filters.stato) {
          case "prenotati":
            statoPrenotazione = "prenotato"
            break
          case "confermati":
            statoPrenotazione = "confermato"
            break
          case "cancellati":
            statoPrenotazione = "cancellato"
            break
        }

        if (statoPrenotazione) {
          queryPrenotazioni = queryPrenotazioni.eq("stato_prenotazione", statoPrenotazione)
        }
      }

      const { data: prenotazioniData, error: prenotazioniError } = await queryPrenotazioni

      if (prenotazioniError) throw prenotazioniError

      console.log("Dati prenotazioni ricevuti:", prenotazioniData?.length || 0)

      // 3. Carica i dati di conversione usando la funzione RPC get_conversion_rate
      const params = {
        p_data_inizio_soggiorno: filters.soggiorno.from ? format(filters.soggiorno.from, "yyyy-MM-dd") : null,
        p_data_fine_soggiorno: filters.soggiorno.to ? format(filters.soggiorno.to, "yyyy-MM-dd") : null,
        p_data_inizio_richiesta: filters.richiesta.from ? format(filters.richiesta.from, "yyyy-MM-dd") : null,
        p_data_fine_richiesta: filters.richiesta.to ? format(filters.richiesta.to, "yyyy-MM-dd") : null,
        p_hotels: filters.hotels.length > 0 ? filters.hotels : null,
        p_tipo_periodo: filters.tipoPeriodo,
      }

      console.log("Parametri RPC per conversion rate:", params)

      let conversionData = []

      try {
        // Impostiamo un timeout più breve per la chiamata fetch
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 15000) // 15 secondi di timeout

        const { data: rpcData, error: conversionError } = await supabase.rpc("get_conversion_rate_optimized", params, {
          signal: abortController.signal,
        })

        clearTimeout(timeoutId)

        if (conversionError) {
          console.error("Errore nella chiamata RPC get_conversion_rate_optimized:", conversionError)
          // Non interrompiamo l'esecuzione, mostriamo un avviso
          toast({
            title: "Avviso",
            description: "Non è stato possibile caricare i dati di conversione. Verranno mostrati solo i dati di base.",
            variant: "warning",
          })
        } else {
          conversionData = rpcData || []
        }
      } catch (convErr) {
        console.error("Errore durante il recupero dei dati di conversione:", convErr)
        // Mostra un toast con l'avviso
        toast({
          title: "Avviso",
          description:
            "Non è stato possibile caricare i dati di conversione a causa di un timeout. Verranno mostrati solo i dati di base.",
          variant: "warning",
        })
      }

      console.log("Dati conversione ricevuti:", conversionData || [])

      // Aggiorna i dati
      setData((prev: any) => ({
        ...prev,
        venditaCamere: {
          preventivi: preventiviData || [],
          conversionData: conversionData || [],
          prenotazioni: prenotazioniData || [],
        },
      }))

      if ((preventiviData || []).length === 0 && (prenotazioniData || []).length === 0) {
        setError("Nessun dato trovato per i criteri selezionati")
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati di vendita camere:", err)
      throw err
    }
  }

  // Funzione per caricare i dati multirichiesta
  const caricaDatiMultirichiesta = async () => {
    try {
      setLoading(true)

      // 1. Carica i dati degli hotel per il mapping
      const { data: hotelData, error: hotelError } = await supabase.from("hotel").select("id, nome, hoteldoor_id")

      if (hotelError) throw hotelError

      // Crea una mappa hoteldoor_id -> nome hotel
      const hotelMap = (hotelData || []).reduce((map, hotel) => {
        if (hotel.hoteldoor_id) {
          map[hotel.hoteldoor_id.toString()] = {
            nome: hotel.nome,
            id: hotel.id,
          }
        }
        return map
      }, {})

      // 2. Carica i dati dei preventivi ricevuti
      let query = supabase.from("preventivi_ricevuti").select("*")

      // Applica filtri per date
      if (
        (filters.tipoPeriodo === "soggiorno" || filters.tipoPeriodo === "entrambi") &&
        filters.soggiorno.from &&
        filters.soggiorno.to
      ) {
        query = query
          .lte("data_arrivo", format(filters.soggiorno.to, "yyyy-MM-dd"))
          .gte("data_partenza", format(filters.soggiorno.from, "yyyy-MM-dd"))
      }

      if (
        (filters.tipoPeriodo === "richiesta" || filters.tipoPeriodo === "entrambi") &&
        filters.richiesta.from &&
        filters.richiesta.to
      ) {
        const startDate = format(filters.richiesta.from, "yyyy-MM-dd")
        const endDate = format(filters.richiesta.to, "yyyy-MM-dd")
        query = query.gte("data_creazione", startDate).lte("data_creazione", endDate)
      }

      const { data: preventiviData, error: preventiviError } = await query

      if (preventiviError) throw preventiviError

      // Filtra i preventivi che contengono almeno uno degli hotel selezionati
      let filteredData = preventiviData || []

      if (filters.hotels.length > 0) {
        // Trova gli hoteldoor_id corrispondenti agli UUID selezionati
        const selectedHotelDoorIds = filters.hotels
          .map((uuid) => {
            const hotel = hotelData?.find((h) => h.id === uuid)
            return hotel?.hoteldoor_id?.toString()
          })
          .filter(Boolean)

        // Filtra i preventivi che contengono almeno uno degli hotel selezionati
        if (selectedHotelDoorIds.length > 0) {
          filteredData = filteredData.filter((preventivo) => {
            if (!preventivo.hotels_richiesti || !Array.isArray(preventivo.hotels_richiesti)) {
              return false
            }

            // Verifica se almeno uno degli hotel richiesti è tra quelli selezionati
            return preventivo.hotels_richiesti.some((hotelId) => selectedHotelDoorIds.includes(hotelId.toString()))
          })
        }
      }

      console.log("Dati multirichiesta ricevuti:", filteredData.length)

      // Aggiorna i dati con i preventivi filtrati e la mappa degli hotel
      setData((prev: any) => ({
        ...prev,
        multirichiesta: {
          preventivi: filteredData || [],
          hotelMap: hotelMap,
        },
      }))

      if (filteredData.length === 0) {
        setError("Nessun dato multirichiesta trovato per i criteri selezionati")
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati multirichiesta:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Funzione per caricare i dati anagrafica
  const caricaDatiAnagrafica = async () => {
    try {
      // Implementa la logica per caricare i dati anagrafica
      // Simile alle altre funzioni ma con elaborazioni specifiche

      let query = supabase.from("preventivi_elaborati").select("*")

      // Applica gli stessi filtri di base
      if (filters.hotels.length > 0) {
        query = query.in("id_hotel", filters.hotels)
      }

      if (
        (filters.tipoPeriodo === "soggiorno" || filters.tipoPeriodo === "entrambi") &&
        filters.soggiorno.from &&
        filters.soggiorno.to
      ) {
        query = query
          .lte("data_arrivo", format(filters.soggiorno.to, "yyyy-MM-dd"))
          .gte("data_partenza", format(filters.soggiorno.from, "yyyy-MM-dd"))
      }

      if (
        (filters.tipoPeriodo === "richiesta" || filters.tipoPeriodo === "entrambi") &&
        filters.richiesta.from &&
        filters.richiesta.to
      ) {
        const startDate = format(filters.richiesta.from, "yyyy-MM-dd")
        const endDate = format(filters.richiesta.to, "yyyy-MM-dd")
        query = query.or(
          `data_elaborazione.gte.${startDate},data_elaborazione.lte.${endDate},data_creazione.gte.${startDate},data_creazione.lte.${endDate}`,
        )
      }

      const { data: anagraficaData, error: anagraficaError } = await query

      if (anagraficaError) throw anagraficaError

      console.log("Dati anagrafica ricevuti:", anagraficaData?.length || 0)

      // Aggiorna i dati
      setData((prev: any) => ({
        ...prev,
        anagrafica: anagraficaData || [],
      }))

      if ((anagraficaData || []).length === 0) {
        setError("Nessun dato anagrafica trovato per i criteri selezionati")
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati anagrafica:", err)
      throw err
    }
  }

  // Funzione per caricare i dati confronto
  const caricaDatiConfronto = async () => {
    try {
      // Implementa la logica per caricare i dati confronto
      // Qui dobbiamo gestire anche il confronto con l'anno precedente

      // Query per i dati correnti
      let queryCorrente = supabase.from("preventivi_elaborati").select("*")

      // Applica gli stessi filtri di base
      if (filters.hotels.length > 0) {
        queryCorrente = queryCorrente.in("id_hotel", filters.hotels)
      }

      if (
        (filters.tipoPeriodo === "soggiorno" || filters.tipoPeriodo === "entrambi") &&
        filters.soggiorno.from &&
        filters.soggiorno.to
      ) {
        queryCorrente = queryCorrente
          .lte("data_arrivo", format(filters.soggiorno.to, "yyyy-MM-dd"))
          .gte("data_partenza", format(filters.soggiorno.from, "yyyy-MM-dd"))
      }

      if (
        (filters.tipoPeriodo === "richiesta" || filters.tipoPeriodo === "entrambi") &&
        filters.richiesta.from &&
        filters.richiesta.to
      ) {
        const startDate = format(filters.richiesta.from, "yyyy-MM-dd")
        const endDate = format(filters.richiesta.to, "yyyy-MM-dd")
        queryCorrente = queryCorrente.or(
          `data_elaborazione.gte.${startDate},data_elaborazione.lte.${endDate},data_creazione.gte.${startDate},data_creazione.lte.${endDate}`,
        )
      }

      const { data: dataCorrente, error: errorCorrente } = await queryCorrente

      if (errorCorrente) throw errorCorrente

      console.log("Dati confronto corrente ricevuti:", dataCorrente?.length || 0)

      let dataPrecedente: any[] = []

      // Se richiesto il confronto con l'anno precedente
      if (filters.confrontoAnnoPrec) {
        // Creiamo una copia dei filtri e modifichiamo le date per l'anno precedente
        const filtersPrecedente = { ...filters }

        if (filtersPrecedente.soggiorno.from && filtersPrecedente.soggiorno.to) {
          const startDate = new Date(filtersPrecedente.soggiorno.from)
          const endDate = new Date(filtersPrecedente.soggiorno.to)

          startDate.setFullYear(startDate.getFullYear() - 1)
          endDate.setFullYear(endDate.getFullYear() - 1)

          filtersPrecedente.soggiorno = {
            from: startDate,
            to: endDate,
          }
        }

        if (filtersPrecedente.richiesta.from && filtersPrecedente.richiesta.to) {
          const startDate = new Date(filtersPrecedente.richiesta.from)
          const endDate = new Date(filtersPrecedente.richiesta.to)

          startDate.setFullYear(startDate.getFullYear() - 1)
          endDate.setFullYear(endDate.getFullYear() - 1)

          filtersPrecedente.richiesta = {
            from: startDate,
            to: endDate,
          }
        }

        // Query per i dati dell'anno precedente
        let queryPrecedente = supabase.from("preventivi_elaborati").select("*")

        // Applica gli stessi filtri di base
        if (filtersPrecedente.hotels.length > 0) {
          queryPrecedente = queryPrecedente.in("id_hotel", filtersPrecedente.hotels)
        }

        if (
          (filtersPrecedente.tipoPeriodo === "soggiorno" || filtersPrecedente.tipoPeriodo === "entrambi") &&
          filtersPrecedente.soggiorno.from &&
          filtersPrecedente.soggiorno.to
        ) {
          queryPrecedente = queryPrecedente
            .lte("data_arrivo", format(filtersPrecedente.soggiorno.to, "yyyy-MM-dd"))
            .gte("data_partenza", format(filtersPrecedente.soggiorno.from, "yyyy-MM-dd"))
        }

        if (
          (filtersPrecedente.tipoPeriodo === "richiesta" || filtersPrecedente.tipoPeriodo === "entrambi") &&
          filtersPrecedente.richiesta.from &&
          filtersPrecedente.richiesta.to
        ) {
          const startDate = format(filtersPrecedente.richiesta.from, "yyyy-MM-dd")
          const endDate = format(filtersPrecedente.richiesta.to, "yyyy-MM-dd")
          queryPrecedente = queryPrecedente.or(
            `data_elaborazione.gte.${startDate},data_elaborazione.lte.${endDate},data_creazione.gte.${startDate},data_creazione.lte.${endDate}`,
          )
        }

        const { data: dataPrec, error: errorPrec } = await queryPrecedente

        if (errorPrec) throw errorPrec

        dataPrecedente = dataPrec || []

        console.log("Dati confronto precedente ricevuti:", dataPrecedente.length)
      }

      // Aggiorna i dati
      setData((prev: any) => ({
        ...prev,
        confronto: {
          corrente: dataCorrente || [],
          precedente: dataPrecedente || [],
        },
      }))

      if ((dataCorrente || []).length === 0) {
        setError("Nessun dato confronto trovato per i criteri selezionati")
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati confronto:", err)
      throw err
    }
  }

  // Funzione per mappare lo stato da stringa a valore numerico
  const mapStatoToValue = (stato: string): number | null => {
    switch (stato) {
      case "da_fare":
        return 1
      case "in_corso":
        return 2
      case "inviato":
        return 3
      case "confermato":
        return 4
      case "cancellato":
        return 5
      default:
        return null
    }
  }

  return (
    <>
      <div className="container relative pb-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight mb-6 text-primary">Domanda (Beta)</h1>
          <Button variant="outline" size="icon" onClick={() => setShowFilters((prev) => !prev)}>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">Toggle filters</span>
          </Button>
        </div>

        {/* Alert in caso di errore */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtri */}
        {showFilters && (
          <Card className="mb-4 border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3">
              <CardTitle className="text-primary font-bold">Filtri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selettore Hotel */}
                <div>
                  <Label htmlFor="hotels">Hotel</Label>
                  <Select onValueChange={(values) => updateFilter("hotels", values === "all" ? [] : [values])}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleziona hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      {hotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Picker Soggiorno */}
                <div>
                  <Label>Periodo Soggiorno</Label>
                  <SimpleDatePicker
                    date={filters.soggiorno.from}
                    setDate={(date) => updateFilter("soggiorno", { ...filters.soggiorno, from: date })}
                    placeholder="Data inizio soggiorno"
                  />
                  <SimpleDatePicker
                    date={filters.soggiorno.to}
                    setDate={(date) => updateFilter("soggiorno", { ...filters.soggiorno, to: date })}
                    placeholder="Data fine soggiorno"
                  />
                </div>

                {/* Date Picker Richiesta */}
                <div>
                  <Label>Periodo Richiesta</Label>
                  <SimpleDatePicker
                    date={filters.richiesta.from}
                    setDate={(date) => updateFilter("richiesta", { ...filters.richiesta, from: date })}
                    placeholder="Data inizio richiesta"
                  />
                  <SimpleDatePicker
                    date={filters.richiesta.to}
                    setDate={(date) => updateFilter("richiesta", { ...filters.richiesta, to: date })}
                    placeholder="Data fine richiesta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selettore Stato */}
                <div>
                  <Label htmlFor="stato">Stato</Label>
                  <Select onValueChange={(value) => updateFilter("stato", value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutti</SelectItem>
                      <SelectItem value="da_fare">Da Fare</SelectItem>
                      <SelectItem value="in_corso">In Corso</SelectItem>
                      <SelectItem value="inviato">Inviato</SelectItem>
                      <SelectItem value="confermato">Confermato</SelectItem>
                      <SelectItem value="cancellato">Cancellato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selettore Tipo Periodo */}
                <div>
                  <Label htmlFor="tipoPeriodo">Tipo Periodo</Label>
                  <Select onValueChange={(value) => updateFilter("tipoPeriodo", value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleziona tipo periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soggiorno">Soggiorno</SelectItem>
                      <SelectItem value="richiesta">Richiesta</SelectItem>
                      <SelectItem value="entrambi">Entrambi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Confronto Anno Precedente */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="confrontoAnnoPrec">Confronta con anno precedente</Label>
                  <Switch
                    id="confrontoAnnoPrec"
                    checked={filters.confrontoAnnoPrec}
                    onCheckedChange={(checked) => updateFilter("confrontoAnnoPrec", checked)}
                  />
                </div>
              </div>

              {/* Pulsante Applica Filtri */}
              <Button onClick={applicaFiltri} disabled={loading}>
                {loading ? (
                  <>
                    Caricamento <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Applica Filtri <Filter className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="vendita-camere" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendita-camere" onClick={() => setActiveTab("vendita-camere")}>
              Vendita Camere
            </TabsTrigger>
            <TabsTrigger value="operatori" onClick={() => setActiveTab("operatori")}>
              Operatori
            </TabsTrigger>
            <TabsTrigger value="multirichiesta" onClick={() => setActiveTab("multirichiesta")}>
              Multirichiesta
            </TabsTrigger>
            <TabsTrigger value="anagrafica" onClick={() => setActiveTab("anagrafica")}>
              Anagrafica
            </TabsTrigger>
            <TabsTrigger value="vs" onClick={() => setActiveTab("vs")}>
              Confronto
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vendita-camere">
            <VenditaCamere data={data.venditaCamere} loading={loading} />
          </TabsContent>
          <TabsContent value="operatori">
            <Operatori data={data.operatori} loading={loading} />
          </TabsContent>
          <TabsContent value="multirichiesta">
            <Multirichiesta data={data.multirichiesta} loading={loading} />
          </TabsContent>
          <TabsContent value="anagrafica">
            <Anagrafica data={data.anagrafica} loading={loading} />
          </TabsContent>
          <TabsContent value="vs">
            <Confronto data={data.confronto} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
