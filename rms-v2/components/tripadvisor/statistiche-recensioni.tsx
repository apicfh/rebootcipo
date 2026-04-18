"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star } from "lucide-react"

interface StatisticheRecensioniProps {
  stats: {
    valutazione_media: number
    totale_recensioni: number
    recensioni_5_stelle: number
    recensioni_4_stelle: number
    recensioni_3_stelle: number
    recensioni_2_stelle: number
    recensioni_1_stella: number
  } | null
}

export function StatisticheRecensioni({ stats }: StatisticheRecensioniProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-2" />
            Statistiche Recensioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Nessuna statistica disponibile</p>
        </CardContent>
      </Card>
    )
  }

  // Calcola le percentuali per ogni valutazione
  const getPercentage = (count: number) => {
    if (stats.totale_recensioni === 0) return 0
    return Math.round((count / stats.totale_recensioni) * 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-2" />
          Statistiche Recensioni
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-6">
          <div className="text-4xl font-bold mb-1">{stats.valutazione_media.toFixed(1)}</div>
          <div className="flex mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(stats.valutazione_media) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Basato su {stats.totale_recensioni} {stats.totale_recensioni === 1 ? "recensione" : "recensioni"}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-16 text-sm">5 stelle</div>
            <Progress value={getPercentage(stats.recensioni_5_stelle)} className="h-2 flex-1" />
            <div className="w-16 text-sm text-right">
              {stats.recensioni_5_stelle} ({getPercentage(stats.recensioni_5_stelle)}%)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 text-sm">4 stelle</div>
            <Progress value={getPercentage(stats.recensioni_4_stelle)} className="h-2 flex-1" />
            <div className="w-16 text-sm text-right">
              {stats.recensioni_4_stelle} ({getPercentage(stats.recensioni_4_stelle)}%)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 text-sm">3 stelle</div>
            <Progress value={getPercentage(stats.recensioni_3_stelle)} className="h-2 flex-1" />
            <div className="w-16 text-sm text-right">
              {stats.recensioni_3_stelle} ({getPercentage(stats.recensioni_3_stelle)}%)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 text-sm">2 stelle</div>
            <Progress value={getPercentage(stats.recensioni_2_stelle)} className="h-2 flex-1" />
            <div className="w-16 text-sm text-right">
              {stats.recensioni_2_stelle} ({getPercentage(stats.recensioni_2_stelle)}%)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 text-sm">1 stella</div>
            <Progress value={getPercentage(stats.recensioni_1_stella)} className="h-2 flex-1" />
            <div className="w-16 text-sm text-right">
              {stats.recensioni_1_stella} ({getPercentage(stats.recensioni_1_stella)}%)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
