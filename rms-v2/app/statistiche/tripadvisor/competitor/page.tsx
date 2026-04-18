"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Search, Star, Trash2 } from "lucide-react"
import Link from "next/link"

// Dati di esempio per i competitor
const sampleCompetitors = [
  { id: "1", nome: "Hotel Riviera", rating: 4.5, recensioni: 320, location: "Rimini" },
  { id: "2", nome: "Grand Hotel", rating: 4.7, recensioni: 512, location: "Riccione" },
  { id: "3", nome: "Hotel Belvedere", rating: 4.2, recensioni: 189, location: "Rimini" },
]

export default function CompetitorPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [competitors, setCompetitors] = useState(sampleCompetitors)

  // Funzione per rimuovere un competitor (solo UI, non implementata realmente)
  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter((comp) => comp.id !== id))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center mb-8">
          <Link href="/statistiche/tripadvisor" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Analisi Competitor</h1>
            <p className="text-muted-foreground">Confronta le performance dei tuoi hotel con quelle dei competitor</p>
          </div>
        </div>

        <Tabs defaultValue="lista" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="lista">Lista Competitor</TabsTrigger>
            <TabsTrigger value="confronto">Confronto Rating</TabsTrigger>
            <TabsTrigger value="recensioni">Analisi Recensioni</TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Aggiungi Competitor</CardTitle>
                <CardDescription>Cerca e aggiungi hotel competitor per monitorare le loro performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cerca hotel su Tripadvisor..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitor Monitorati</CardTitle>
                <CardDescription>Lista degli hotel competitor che stai monitorando</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nome</th>
                        <th className="text-left py-3 px-4">Località</th>
                        <th className="text-left py-3 px-4">Rating</th>
                        <th className="text-left py-3 px-4">Recensioni</th>
                        <th className="text-right py-3 px-4">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.map((competitor) => (
                        <tr key={competitor.id} className="border-b">
                          <td className="py-3 px-4">{competitor.nome}</td>
                          <td className="py-3 px-4">{competitor.location}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
                              {competitor.rating}
                            </div>
                          </td>
                          <td className="py-3 px-4">{competitor.recensioni}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => removeCompetitor(competitor.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {competitors.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            Nessun competitor aggiunto. Usa la barra di ricerca per aggiungere competitor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confronto">
            <Card>
              <CardHeader>
                <CardTitle>Confronto Rating</CardTitle>
                <CardDescription>Confronta i rating dei tuoi hotel con quelli dei competitor</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="mb-2">Grafico di confronto rating (WIP)</p>
                  <p className="text-sm">Questa funzionalità è in fase di sviluppo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recensioni">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Recensioni</CardTitle>
                <CardDescription>
                  Analizza le recensioni dei competitor per identificare punti di forza e debolezza
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="mb-2">Analisi delle recensioni (WIP)</p>
                  <p className="text-sm">Questa funzionalità è in fase di sviluppo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
