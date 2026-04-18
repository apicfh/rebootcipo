"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"

export default function PrezziLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Strategia Prezzi</h1>
            <p className="text-muted-foreground mt-2">Definisci le strategie tariffarie per Club Family Hotel</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
