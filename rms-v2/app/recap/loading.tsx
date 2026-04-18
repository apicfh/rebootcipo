import { Skeleton } from "@/components/ui/skeleton"

export default function RecapLoading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>

        {/* Filtri skeleton */}
        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
          <Skeleton className="h-6 w-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>

      {/* Card totale skeleton */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-1">
        <div className="bg-white rounded-lg p-4">
          <Skeleton className="h-6 w-48 mx-auto mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-8 w-20 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards hotel skeleton */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-16 mx-auto mb-2" />
                  <Skeleton className="h-6 w-12 mx-auto" />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-16 mx-auto mb-2" />
                  <Skeleton className="h-6 w-12 mx-auto" />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-24 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto mt-1" />
              </div>

              <div className="pt-3 border-t space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grafico skeleton */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
