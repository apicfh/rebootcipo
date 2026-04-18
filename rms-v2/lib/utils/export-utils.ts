// Export utilities per graici e dati

export interface ExportData {
  week: string
  [key: string]: string | number | null
}

// Scarica i dati come CSV
export function downloadCSV(data: ExportData[], filename: string) {
  if (!data || data.length === 0) return

  // Estrai gli header dalla prima riga
  const headers = Object.keys(data[0])

  // Crea il contenuto CSV
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escapa i valori che contengono virgole o newline
          if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  // Crea il Blob e scarica
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Scarica il grafico come PNG usando html2canvas
export async function downloadChartAsImage(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error("[v0] Element not found for export:", elementId)
      return
    }

    // Dinamicamente importa html2canvas per evitare problemi di bundling
    const html2canvas = (await import("html2canvas")).default

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
    })

    const link = document.createElement("a")
    link.href = canvas.toDataURL("image/png")
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("[v0] Error exporting chart:", error)
  }
}

// Trasforma i dati del grafico in formato tabellare per visualizzazione
export function formatChartDataForTable(data: ExportData[]): ExportData[] {
  return data.map((item) => {
    const formatted: ExportData = { week: item.week }
    for (const [key, value] of Object.entries(item)) {
      if (key !== "week" && typeof value === "number") {
        formatted[key] = Math.round(value * 100) / 100
      } else {
        formatted[key] = value
      }
    }
    return formatted
  })
}
