"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { RecapData } from "@/lib/services/recap-service"

interface RecapCardProps {
  data: RecapData
}

export function RecapCard({ data }: RecapCardProps) {
  const percentualeOccupazione =
    data.total_roombook > 0
      ? ((data.total_roombook / (data.total_roombook + data.total_invenduto)) * 100).toFixed(1)
      : "0"

  const revPerRoom = data.total_roombook > 0 ? (data.total_rev / data.total_roombook).toFixed(0) : "0"

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {data.hotel_nome}
          </CardTitle>
          <Badge variant={Number.parseFloat(percentualeOccupazione) > 70 ? "default" : "secondary"} className="text-xs">
            {percentualeOccupazione}% occ.
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metriche principali */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Room Book</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{data.total_roombook.toLocaleString()}</p>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-600">Invenduto</span>
            </div>
            <p className="text-xl font-bold text-red-600">{data.total_invenduto.toLocaleString()}</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs text-gray-600">Revenue Totale</span>
          </div>
          <p className="text-2xl font-bold text-green-600">€{data.total_rev.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">€{revPerRoom}/camera</p>
        </div>

        {/* Statistiche aggiuntive */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Camere totali:</span>
            <span className="font-medium">{(data.total_roombook + data.total_invenduto).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">ADR medio:</span>
            <span className="font-medium">€{revPerRoom}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
