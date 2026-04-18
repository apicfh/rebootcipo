import type { FalzaChallengeData } from "@/lib/services/falza-challenge-service"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface ChallengeSummaryProps {
  data: FalzaChallengeData[]
}

export function ChallengeSummary({ data }: ChallengeSummaryProps) {
  // Filtra l'hotel "Tutti" dai dati
  const filteredData = data.filter((item) => item.nome_hotel !== "Tutti")

  // Calcola i totali
  const totals = filteredData.reduce(
    (acc, item) => {
      acc.prenotazioni2024 += item.prenotazioni_2024
      acc.prenotazioni2025 += item.prenotazioni_2025
      acc.differenza += item.differenza
      return acc
    },
    { prenotazioni2024: 0, prenotazioni2025: 0, differenza: 0 },
  )

  // Calcola l'obiettivo (prenotazioni 2024 + 12)
  const obiettivo = totals.prenotazioni2024 + 12

  // Calcola la percentuale di completamento
  const percentageComplete = Math.round((totals.prenotazioni2025 / obiettivo) * 100)

  // Determina se siamo in positivo o negativo rispetto all'obiettivo
  const isPositive = totals.prenotazioni2025 >= obiettivo
  const difference = totals.prenotazioni2025 - obiettivo

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Obiettivo</p>
            <p className="text-3xl font-bold">{obiettivo}</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Attuale</p>
            <p className="text-3xl font-bold">{totals.prenotazioni2025}</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Differenza</p>
            <div className="flex items-center">
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                  isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {isPositive ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                <span className="text-xl font-bold">
                  {isPositive ? "+" : ""}
                  {difference}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Completamento</p>
            <p className="text-3xl font-bold">{percentageComplete}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
