import type React from "react"
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">{children}</div>
    </div>
  )
}
