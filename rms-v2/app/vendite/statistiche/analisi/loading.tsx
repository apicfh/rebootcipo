import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalisiLoading() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-primary">Analisi Predittiva</h1>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
