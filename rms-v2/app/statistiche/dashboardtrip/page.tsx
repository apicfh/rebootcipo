"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Clock, ExternalLink, Search, Star } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { ImportaRecensioniV3 } from "@/components/tripadvisor/importa-recensioni-v3"
import { EseguiCronButton } from "@/components/tripadvisor/esegui-cron-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipo per gli hotel
interface Hotel {
  id: string
  nome: string
  tripadvisor_id?: string
  recensioni_count?: number
  ultima_sincronizzazione?: string
}

// Tipo per i log cron
interface CronLog {
  id: string
  executed_at: string
  status: string
  job_name: string
  hotels_processed: number
  hotels_success: number
  hotels_error: number
  reviews_imported: number
  error_message?: string
}

export default function DashboardTripadvisor() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"dashboard" | "cronlog">("dashboard")
  const [cronLogs, setCronLogs] = useState<CronLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const fetchCronLogs = async () => {
    setLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from("cron_log_tripadvisor")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setCronLogs(data || [])
    } catch (err) {
      console.error("Errore nel recupero dei log cron:", err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  useEffect(() => {
    async function fetchHotels() {
      setLoading(true)
      try {
        const { data: hotelsData, error: hotelsError } = await supabase
          .from("hotel")
          .select("id, nome, tripadvisor_id")
          .order("nome")

        if (hotelsError) throw hotelsError

        const hotelsWithStats = await Promise.all(
          hotelsData.map(async (hotel) => {
            if (!hotel.id) return hotel

            const { count } = await supabase
              .from("tripadvisor_recensioni")
              .select("*", { count: "exact", head: true })
              .eq("hotel_id", hotel.id)

            const { data: lastSync } = await supabase
              .from("tripadvisor_recensioni")
              .select("importato_il")
              .eq("hotel_id", hotel.id)
              .order("importato_il", { ascending: false })
              .limit(1)
              .single()

            return {
              ...hotel,
              recensioni_count: count || 0,
              ultima_sincronizzazione: lastSync?.importato_il || null,
            }
          }),
        )

        setHotels(hotelsWithStats)
      } catch (err) {
        console.error("Errore nel recupero degli hotel:", err)
        setError("Impossibile caricare gli hotel. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Mai"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleSyncSuccess = (hotelId: string) => {
    setHotels((prevHotels) =>
      prevHotels.map((hotel) => {
        if (hotel.id === hotelId) {
          return {
            ...hotel,
            ultima_sincronizzazione: new Date().toISOString(),
            recensioni_count: (hotel.recensioni_count || 0) + 1,
          }
        }
        return hotel
      }),
    )
  }

  const handleOpenCronLog = () => {
    console.log("Apertura registro cron")
    setActiveTab("cronlog")
    fetchCronLogs()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" className="h-8 mr-3" />
          Dashboard Tripadvisor
        </h1>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" className="h-8 mr-3" />
            Dashboard Tripadvisor
          </h1>
          <div className="flex gap-3">
            <EseguiCronButton />
            <Button asChild variant="outline">
              <Link href="/statistiche/tripadvisor">
                <Search className="mr-2 h-4 w-4" />
                Guarda le recensioni
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sincronizzazione Recensioni Tripadvisor</CardTitle>
            <CardDescription>
              Importa le recensioni di Tripadvisor nel database per una visualizzazione più rapida e analisi avanzate.
              La nuova versione V3 importa sia le recensioni recenti che quelle storiche.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={activeTab === "cronlog" ? "default" : "ghost"}
                className="flex items-center p-4 border rounded-lg text-left h-auto"
                onClick={handleOpenCronLog}
              >
                <div className="mr-4 p-2 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Registro Cron</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualizza lo storico delle sincronizzazioni automatiche
                  </p>
                </div>
              </Button>
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4 p-2 bg-green-100 rounded-full">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Analisi avanzate</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualizza statistiche e tendenze delle recensioni nel tempo
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sezione Registro Cron */}
        {activeTab === "cronlog" && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Registro Sincronizzazioni Automatiche</h2>
              <Button variant="outline" onClick={() => setActiveTab("dashboard")}>
                Torna alla dashboard
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Storico delle sincronizzazioni automatiche delle recensioni Tripadvisor</CardTitle>
                <CardDescription>
                  Visualizza i dettagli delle sincronizzazioni programmate e il loro stato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList className="mb-4">
                    <TabsTrigger value="summary">Riepilogo</TabsTrigger>
                    <TabsTrigger value="details">Dettagli</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary">
                    {loadingLogs ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                      </div>
                    ) : cronLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Nessuna sincronizzazione registrata</div>
                    ) : (
                      <div className="max-h-[600px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead>Data e Ora</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Hotel Processati</TableHead>
                              <TableHead>Recensioni Importate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cronLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>{formatDateTime(log.executed_at)}</TableCell>
                                <TableCell>
                                  <Badge variant={log.status === "success" ? "success" : "destructive"}>
                                    {log.status === "success" ? "Successo" : "Errore"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {log.hotels_processed}
                                  {log.hotels_error > 0 && (
                                    <span className="text-red-500 ml-2">({log.hotels_error} con errori)</span>
                                  )}
                                </TableCell>
                                <TableCell>{log.reviews_imported}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details">
                    {loadingLogs ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                      </div>
                    ) : cronLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Nessuna sincronizzazione registrata</div>
                    ) : (
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        {cronLogs.map((log) => (
                          <Card key={log.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle className="text-base">
                                    Sincronizzazione del {formatDateTime(log.executed_at)}
                                  </CardTitle>
                                  <CardDescription>{log.job_name}</CardDescription>
                                </div>
                                <Badge variant={log.status === "success" ? "success" : "destructive"}>
                                  {log.status === "success" ? "Successo" : "Errore"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-muted p-3 rounded-md text-center">
                                  <div className="text-sm text-muted-foreground">Hotel Processati</div>
                                  <div className="text-xl font-bold">{log.hotels_processed}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-md text-center">
                                  <div className="text-sm text-muted-foreground">Hotel con Successo</div>
                                  <div className="text-xl font-bold text-green-600">{log.hotels_success}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded-md text-center">
                                  <div className="text-sm text-muted-foreground">Hotel con Errori</div>
                                  <div className="text-xl font-bold text-red-600">{log.hotels_error}</div>
                                </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded-md text-center mb-4">
                                <div className="text-sm text-muted-foreground">Recensioni Importate</div>
                                <div className="text-xl font-bold text-blue-600">{log.reviews_imported}</div>
                              </div>

                              {log.error_message && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTitle>Errore</AlertTitle>
                                  <AlertDescription>{log.error_message}</AlertDescription>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Nascondi la sezione hotel quando si visualizza il registro cron */}
        {activeTab === "cronlog" ? null : (
          <>
            <h2 className="text-xl font-semibold mt-4">Hotel configurati</h2>

            {hotels.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Nessun hotel configurato con ID Tripadvisor.</p>
                  <div className="flex justify-center mt-4">
                    <Button asChild>
                      <Link href="/admin/tripadvisor">Configura hotel</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              hotels.map((hotel) => (
                <Card key={hotel.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{hotel.nome}</CardTitle>
                        <CardDescription>
                          {hotel.tripadvisor_id ? (
                            <>ID Tripadvisor: {hotel.tripadvisor_id}</>
                          ) : (
                            <span className="text-red-500">ID Tripadvisor non configurato</span>
                          )}
                        </CardDescription>
                      </div>
                      {hotel.recensioni_count !== undefined && (
                        <Badge variant={hotel.recensioni_count > 0 ? "default" : "outline"}>
                          {hotel.recensioni_count} recensioni
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Calendar className="mr-2 h-4 w-4" />
                      Ultima sincronizzazione: {formatDate(hotel.ultima_sincronizzazione)}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild disabled={!hotel.tripadvisor_id}>
                      <Link href={`/statistiche/tripadvisor/hotel/${hotel.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visualizza dettagli
                      </Link>
                    </Button>

                    {hotel.tripadvisor_id ? (
                      <ImportaRecensioniV3 hotelId={hotel.id} onSuccess={() => handleSyncSuccess(hotel.id)} />
                    ) : (
                      <Button variant="outline" asChild>
                        <Link href="/admin/tripadvisor">Configura ID</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </>
  )

  useEffect(() => {
    if (activeTab === "cronlog") {
      fetchCronLogs()
    }
  }, [activeTab])
}
