import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="mt-2 h-4 w-[350px]" />
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-[240px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <Skeleton className="mb-6 h-[120px] w-full" />

      <Skeleton className="mb-4 h-8 w-[200px]" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
      </div>
    </div>
  )
}
