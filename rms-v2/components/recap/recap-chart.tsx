"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { RecapData } from "@/lib/services/recap-service"

interface RecapChartProps {
  data: RecapData[]
}

export function RecapChart({ data }: RecapChartProps) {
  const chartData = data.map((hotel) => ({
    nome: hotel.hotel_nome.length > 15 ? hotel.hotel_nome.substring(0, 15) + "..." : hotel.hotel_nome,
    roombook: hotel.total_roombook,
    invenduto: hotel.total_invenduto,
    revenue: hotel.total_rev,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Confronto Performance Hotel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue") return [`€${Number(value).toLocaleString()}`, "Revenue"]
                  return [Number(value).toLocaleString(), name === "roombook" ? "Room Book" : "Invenduto"]
                }}
              />
              <Legend />
              <Bar dataKey="roombook" fill="#3b82f6" name="Room Book" />
              <Bar dataKey="invenduto" fill="#ef4444" name="Invenduto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
