import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WeeklyChallengeCardProps {
  data: {
    nome_hotel: string
    id_hotel: string
    prenotazioni_2024: number
    prenotazioni_2025: number
    differenza: number
  }
}

export function WeeklyChallengeCard({ data }: WeeklyChallengeCardProps) {
  const isPositive = data.differenza >= 0
  const hasBookings = data.prenotazioni_2025 > 0
  const isSpecialHotel = data.nome_hotel === "RIMINI" || data.nome_hotel === "RIVI"

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`pb-2 ${isSpecialHotel ? "bg-amber-100" : "bg-primary-100"}`}>
        <CardTitle className="text-lg font-bold">{data.nome_hotel}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Obiettivo</p>
            <p className="text-2xl font-bold">{data.prenotazioni_2024}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Attuale</p>
            <p className={`text-2xl font-bold ${!hasBookings ? "text-red-500" : ""}`}>{data.prenotazioni_2025}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 ${
              isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {isPositive ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
            <span className="font-medium">
              {isPositive ? "+" : ""}
              {data.differenza}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
