import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Benvenuto nel sistema di gestione Club Family Hotel</h1>

        <p className="text-gray-600 mb-8">Se non vieni reindirizzato automaticamente, usa il pulsante qui sotto.</p>

        <div className="flex justify-center">
          <Link
            href="/vendite/statistiche"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
          >
            Annamo!
          </Link>
        </div>
      </div>
    </div>
  )
}
