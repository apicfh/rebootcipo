import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AndamentoRecensioniLoading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/3"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
