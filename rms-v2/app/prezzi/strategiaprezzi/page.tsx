import { FormCreaPrezzo } from "@/components/strategia-prezzi/form-crea-prezzo"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StrategiaPrezziPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button asChild variant="outline">
          <Link href="/prezzi/strategiaprezzi/caricastorico">Carica Prezzi Storici</Link>
        </Button>
      </div>

      <FormCreaPrezzo />
    </div>
  )
}
