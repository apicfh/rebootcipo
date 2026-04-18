import type React from "react"
import { Sidebar } from "@/components/sidebar"

export default function StatisticheLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
