import { Card, CardContent } from "@/components/ui/card"
import type { RecensioneTripadvisor } from "@/lib/services/recensioni-tripadvisor-service"
import { Star } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface RecensioneCardProps {
  recensione: RecensioneTripadvisor
}

export function RecensioneCard({ recensione }: RecensioneCardProps) {
  // Funzione per renderizzare le stelle in base alla valutazione
  const renderStars = (valutazione: number) => {
    const stars = []
    const fullStars = Math.floor(valutazione)
    const hasHalfStar = valutazione % 1 >= 0.5

    // Stelle piene
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    // Stelle vuote
    const emptyStars = 5 - fullStars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return stars
  }

  // Formatta la data in formato italiano
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: it })
    } catch (error) {
      return "Data non disponibile"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{recensione.titolo}</h3>
          <div className="flex space-x-1 ml-2 flex-shrink-0">{renderStars(recensione.valutazione)}</div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-4 mb-4">{recensione.testo}</p>

        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
          <div>
            <span className="font-medium">{recensione.nome_utente}</span>
            {recensione.provenienza_utente && <span> · {recensione.provenienza_utente}</span>}
          </div>
          <div>{formatDate(recensione.data_pubblicazione)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
