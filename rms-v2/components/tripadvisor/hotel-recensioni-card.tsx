import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HotelRecensioniCardProps {
  hotelId: string
  hotelNome: string
  numeroRecensioni: number
  mediaValutazione: number
  nuoveRecensioni: number
}

export function HotelRecensioniCard({
  hotelId,
  hotelNome,
  numeroRecensioni,
  mediaValutazione,
  nuoveRecensioni,
}: HotelRecensioniCardProps) {
  // Arrotonda la media a 1 decimale
  const mediaArrotondata = Math.round(mediaValutazione * 10) / 10

  return (
    <Link href={`/recensionitripadvisor/${hotelId}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6 flex flex-col h-full">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{hotelNome}</h3>

          <div className="flex items-center mb-3">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-4 w-4 ${
                    star <= mediaArrotondata
                      ? "text-yellow-400 fill-yellow-400"
                      : star - 0.5 <= mediaArrotondata
                        ? "text-yellow-400 fill-yellow-400 opacity-50"
                        : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{mediaArrotondata.toFixed(1)}</span>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {numeroRecensioni} {numeroRecensioni === 1 ? "recensione" : "recensioni"} totali
          </p>

          <div className="mt-auto">
            {nuoveRecensioni > 0 ? (
              <Badge variant="secondary" className="font-normal">
                {nuoveRecensioni} {nuoveRecensioni === 1 ? "nuova" : "nuove"} negli ultimi 7 giorni
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Nessuna nuova recensione</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
