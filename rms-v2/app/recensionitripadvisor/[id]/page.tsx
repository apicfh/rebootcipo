"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, StarIcon } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { type RecensioneTripadvisor, getRecensioniHotel } from "@/lib/services/recensioni-tripadvisor-service"

export default function HotelRecensioniPage() {
  const params = useParams()
  const hotelId = params.id as string

  const [recensioni, setRecensioni] = useState<RecensioneTripadvisor[]>([])
  const [totaleRecensioni, setTotaleRecensioni] = useState(0)
  const [hotelNome, setHotelNome] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paginaCorrente, setPaginaCorrente] = useState(1)
  const elementiPerPagina = 10

  // Carica le recensioni dell'hotel
  useEffect(() => {
    async function fetchRecensioni() {
      setLoading(true)
      setError(null)
      try {
        const { recensioni, totale } = await getRecensioniHotel(hotelId, paginaCorrente, elementiPerPagina)
        setRecensioni(recensioni)
        setTotaleRecensioni(totale)

        // Imposta il nome dell'hotel dalla prima recensione
        if (recensioni.length > 0) {
          setHotelNome(recensioni[0].hotel_nome)
        }
      } catch (err) {
        console.error("Errore nel caricamento delle recensioni:", err)
        setError("Si è verificato un errore nel caricamento delle recensioni. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecensioni()
  }, [hotelId, paginaCorrente])

  const handlePageChange = (nuovaPagina: number) => {
    setPaginaCorrente(nuovaPagina)
    // Scorri verso l'alto quando cambia pagina
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Formatta la data in formato italiano
  const formattaData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center mb-8">
          <Link href="/recensionitripadvisor" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{hotelNome || "Dettaglio Hotel"}</h1>
            <p className="text-muted-foreground">
              {totaleRecensioni} {totaleRecensioni === 1 ? "recensione" : "recensioni"} su Tripadvisor
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : recensioni.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <img src="/icons/recensioni-panda.png" alt="Nessuna recensione" className="h-32 w-32 mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Nessuna recensione trovata</h3>
              <p className="text-muted-foreground text-center">Non ci sono recensioni disponibili per questo hotel.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Titolo</TableHead>
                        <TableHead className="w-[100px]">Valutazione</TableHead>
                        <TableHead>Recensione</TableHead>
                        <TableHead className="w-[180px]">Utente</TableHead>
                        <TableHead className="w-[120px]">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recensioni.map((recensione) => (
                        <TableRow key={recensione.id}>
                          <TableCell className="font-medium align-top">{recensione.titolo}</TableCell>
                          <TableCell className="align-top">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= recensione.valutazione ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="whitespace-pre-line">{recensione.testo}</div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div>{recensione.nome_utente}</div>
                            {recensione.provenienza_utente && (
                              <div className="text-xs text-muted-foreground">{recensione.provenienza_utente}</div>
                            )}
                          </TableCell>
                          <TableCell className="align-top">{formattaData(recensione.data_pubblicazione)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Pagination
              totalItems={totaleRecensioni}
              itemsPerPage={elementiPerPagina}
              currentPage={paginaCorrente}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
