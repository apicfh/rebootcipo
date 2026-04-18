import type React from "react"
import "@/app/globals.css"
import "@/app/palette.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { PaletteSwitcher } from "@/components/palette-switcher"
import { VoiceAssistant } from "@/components/voice-assistant"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Club Family Hotel",
  description: "Gestione Club Family Hotel",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="fixed top-4 right-4 z-50">
            <PaletteSwitcher />
          </div>
          {children}
          <VoiceAssistant />
        </ThemeProvider>
      </body>
    </html>
  )
}
