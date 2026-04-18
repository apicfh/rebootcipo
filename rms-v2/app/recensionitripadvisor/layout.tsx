import type React from "react"

export const metadata = {
  title: "Recensioni Tripadvisor - Club Family Hotel",
  description: "Visualizza e gestisci le recensioni di Tripadvisor per i tuoi hotel",
}

export default function RecensioniTripadvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>
}
