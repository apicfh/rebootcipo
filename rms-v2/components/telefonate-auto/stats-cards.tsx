import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneCall, Clock, Timer, TrendingUp } from "lucide-react"
import type { ChiamateAggregato } from "@/lib/services/telefonate-auto-service"
import { TelefonateAutoService } from "@/lib/services/telefonate-auto-service"

interface StatsCardsProps {
  dati: ChiamateAggregato[]
}

export function StatsCards({ dati }: StatsCardsProps) {
  const service = new TelefonateAutoService()
  const stats = service.calculateStats(dati)

  const getPercentualeRispostaBadge = (percentuale: number) => {
    if (percentuale >= 80) return { variant: "default" as const, color: "bg-green-500", text: "Ottimo" }
    if (percentuale >= 60) return { variant: "secondary" as const, color: "bg-yellow-500", text: "Buono" }
    return { variant: "destructive" as const, color: "bg-red-500", text: "Critico" }
  }

  const getAttesaMediaBadge = (attesa: number) => {
    if (attesa <= 15) return { variant: "default" as const, color: "bg-green-500", text: "Veloce" }
    if (attesa <= 30) return { variant: "secondary" as const, color: "bg-yellow-500", text: "Normale" }
    return { variant: "destructive" as const, color: "bg-red-500", text: "Lento" }
  }

  const percentualeBadge = getPercentualeRispostaBadge(stats.percentualeRisposta)
  const attesaBadge = getAttesaMediaBadge(stats.attesaMedia)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Chiamate Totali */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chiamate Totali</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totaleChiamate.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{dati.length} giorni analizzati</p>
        </CardContent>
      </Card>

      {/* Chiamate Risposte */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chiamate Risposte</CardTitle>
          <PhoneCall className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totaleRisposte.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {(stats.totaleChiamate - stats.totaleRisposte).toLocaleString()} non risposte
          </p>
        </CardContent>
      </Card>

      {/* Percentuale Risposta */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Risposta</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.percentualeRisposta.toFixed(1)}%</div>
            <Badge variant={percentualeBadge.variant} className="text-xs">
              {percentualeBadge.text}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Target: &gt;80%</p>
        </CardContent>
      </Card>

      {/* Attesa Media */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attesa Media</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.attesaMedia.toFixed(1)}s</div>
            <Badge variant={attesaBadge.variant} className="text-xs">
              {attesaBadge.text}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Target: &lt;15s</p>
        </CardContent>
      </Card>

      {/* Durata Media */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Durata Media</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(stats.durataMedia / 60)}m {Math.floor(stats.durataMedia % 60)}s
          </div>
          <p className="text-xs text-muted-foreground">{stats.durataMedia.toFixed(1)} secondi totali</p>
        </CardContent>
      </Card>
    </div>
  )
}
