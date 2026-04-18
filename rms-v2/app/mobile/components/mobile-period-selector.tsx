"use client"

interface MobilePeriodSelectorProps {
  selectedPeriod: string
  onSelectPeriod: (period: string) => void
}

export function MobilePeriodSelector({ selectedPeriod, onSelectPeriod }: MobilePeriodSelectorProps) {
  const periods = [
    { id: "oggi", label: "Oggi" },
    { id: "ieri", label: "Ieri" },
    { id: "settimana", label: "7 giorni" },
    { id: "mese", label: "30 giorni" },
    { id: "1_gennaio", label: "1 gennaio" },
    { id: "da_inizio", label: "1 ottobre" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.id}
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            selectedPeriod === period.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => onSelectPeriod(period.id)}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
