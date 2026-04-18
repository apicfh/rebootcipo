"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Loader2, X } from "lucide-react"
import { getOccupationStats } from "@/lib/services/occupation-service"
import { getBookingsStats } from "@/lib/services/bookings-service"
import { supabase } from "@/lib/supabase/client"

type Hotel = {
  id: string
  nome: string
}

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])

  // Rileva se siamo su mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const { data, error } = await supabase.from("hotel").select("id, nome").order("nome")

        if (error) {
          console.error("[v0] Errore caricamento hotel:", error)
          return
        }

        if (data) {
          console.log("[v0] Hotel caricati dal database:", data)
          setHotels(data)
        }
      } catch (error) {
        console.error("[v0] Errore nel caricamento hotel:", error)
      }
    }

    loadHotels()
  }, [])

  const findHotelByName = (question: string): Hotel | null => {
    const lowerQuestion = question.toLowerCase()

    console.log("[v0] Cercando hotel nella domanda:", lowerQuestion)
    console.log(
      "[v0] Hotel disponibili:",
      hotels.map((h) => h.nome),
    )

    // Cerca corrispondenza esatta o parziale
    for (const hotel of hotels) {
      const hotelNameLower = hotel.nome.toLowerCase()

      // Corrispondenza esatta
      if (lowerQuestion.includes(hotelNameLower)) {
        console.log("[v0] Hotel trovato (match esatto):", hotel.nome)
        return hotel
      }

      // Corrispondenza parziale (parole chiave)
      const hotelWords = hotelNameLower.split(" ")
      const matchedWords = hotelWords.filter((word) => word.length > 3 && lowerQuestion.includes(word))

      // Se almeno metà delle parole significative matchano, consideriamo trovato l'hotel
      if (matchedWords.length > 0 && matchedWords.length >= hotelWords.length / 2) {
        console.log("[v0] Hotel trovato (match parziale):", hotel.nome, "parole matchate:", matchedWords)
        return hotel
      }
    }

    console.log("[v0] Nessun hotel trovato nella domanda")
    return null
  }

  // Pattern matching per riconoscere le domande
  const processQuestion = async (question: string) => {
    const lowerQuestion = question.toLowerCase()

    console.log("[v0] Processing question:", lowerQuestion)

    if (
      lowerQuestion.includes("prenotazioni") &&
      (lowerQuestion.includes("preso") || lowerQuestion.includes("presi"))
    ) {
      console.log("[v0] Question type: bookings")
      try {
        const stats = await getBookingsStats()
        console.log("[v0] Bookings stats received:", stats)
        return `Ieri abbiamo preso ${stats.yesterday} prenotazioni, nell'ultima settimana ${stats.lastWeek}, e nell'ultimo mese ${stats.lastMonth}.`
      } catch (error) {
        console.error("[v0] Errore nel recupero prenotazioni:", error)
        return "Mi dispiace, non riesco a recuperare i dati delle prenotazioni."
      }
    }

    if (lowerQuestion.includes("occupazione")) {
      console.log("[v0] Question type: occupation")

      const hotel = findHotelByName(question)

      if (!hotel) {
        const availableHotels = hotels.map((h) => h.nome).join(", ")
        return `Non ho capito quale hotel. Hotel disponibili: ${availableHotels}`
      }

      try {
        console.log("[v0] Fetching occupation stats for hotel:", hotel)

        const stats = await getOccupationStats(hotel.id)

        console.log("[v0] Occupation stats received:", stats)

        return `L'occupazione a ${hotel.nome} è del ${stats.avgOccupation}%, con minima del ${stats.minOccupation}% il ${stats.minDate} e massima del ${stats.maxOccupation}% il ${stats.maxDate}.`
      } catch (error) {
        console.error("[v0] Errore nel recupero occupazione:", error)
        return "Mi dispiace, non riesco a recuperare i dati di occupazione."
      }
    }

    console.log("[v0] Question not recognized")
    const randomResponses = ["per me è la cipolla", "bazinga"]
    const randomResponse = randomResponses[Math.floor(Math.random() * randomResponses.length)]
    return randomResponse
  }

  // Gestione Speech Recognition (solo Android/Chrome)
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      // Fallback a input testuale su iOS
      const question = prompt("Inserisci la tua domanda:")
      if (question) {
        setTranscript(question)
        handleQuestion(question)
      }
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "it-IT"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("")
      setResponse("")
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setTranscript(transcript)
      handleQuestion(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error("Errore riconoscimento vocale:", event.error)
      setIsListening(false)
      setResponse("Errore nel riconoscimento vocale. Riprova.")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // Gestione della domanda
  const handleQuestion = async (question: string) => {
    setIsProcessing(true)
    try {
      const answer = await processQuestion(question)
      setResponse(answer)
      // Text-to-Speech
      speak(answer)
    } catch (error) {
      console.error("Errore nella gestione della domanda:", error)
      setResponse("Si è verificato un errore. Riprova.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Text-to-Speech
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "it-IT"
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  // Non mostrare su desktop
  if (!isMobile) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Mic className="h-6 w-6" />
        </Button>
      )}

      {/* Modal Assistente */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <Card className="w-full max-w-md mb-4 animate-in slide-in-from-bottom">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assistente Vocale</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pulsante Microfono */}
              <div className="flex justify-center">
                <Button
                  onClick={startListening}
                  disabled={isListening || isProcessing}
                  size="lg"
                  className="h-20 w-20 rounded-full"
                  variant={isListening ? "destructive" : "default"}
                >
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : isListening ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              </div>

              {/* Stato */}
              <div className="text-center text-sm text-muted-foreground">
                {isListening
                  ? "Sto ascoltando..."
                  : isProcessing
                    ? "Elaborazione in corso..."
                    : "Tocca il microfono per parlare"}
              </div>

              {/* Trascrizione */}
              {transcript && (
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-medium mb-1">Hai chiesto:</p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}

              {/* Risposta */}
              {response && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium mb-1">Risposta:</p>
                  <p className="text-sm">{response}</p>
                </div>
              )}

              {!transcript && !response && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Domande disponibili:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Quante prenotazioni abbiamo preso?</li>
                    <li>Qual è l'occupazione a [nome hotel]?</li>
                  </ul>
                  <p className="text-xs italic mt-2">Puoi chiedere l'occupazione per qualsiasi hotel della catena!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
