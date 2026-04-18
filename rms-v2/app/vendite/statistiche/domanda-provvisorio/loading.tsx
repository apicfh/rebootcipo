import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Riepilogo Domanda Provvisoria</h1>

      {/* Filtri - Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-80 h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella - Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Dati per Hotel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>

      {/* Grafico - Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Andamento Domanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array(13)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ))}
          </div>
          <div className="h-80 bg-gray-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    </div>
  )
}
