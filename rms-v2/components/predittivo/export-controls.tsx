"use client"

import { useState } from "react"
import { Download, Table2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadCSV, downloadChartAsImage, ExportData } from "@/lib/utils/export-utils"

interface ExportControlsProps {
  data: ExportData[]
  chartElementId: string
  filename: string
  disabled?: boolean
}

export function ExportControls({ data, chartElementId, filename, disabled = false }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadCSV = () => {
    try {
      downloadCSV(data, `${filename}.csv`)
    } catch (error) {
      console.error("[v0] Error downloading CSV:", error)
    }
  }

  const handleDownloadImage = async () => {
    setIsExporting(true)
    try {
      await downloadChartAsImage(chartElementId, `${filename}.png`)
    } catch (error) {
      console.error("[v0] Error downloading image:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadCSV}
        disabled={disabled || data.length === 0}
        title="Scarica dati in formato CSV"
      >
        <Table2 className="mr-2 h-4 w-4" />
        Esporta Tabella
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadImage}
        disabled={disabled || isExporting || data.length === 0}
        title="Scarica grafico come immagine PNG"
      >
        <ImageIcon className="mr-2 h-4 w-4" />
        {isExporting ? "Esportazione..." : "Esporta Grafico"}
      </Button>
    </div>
  )
}
