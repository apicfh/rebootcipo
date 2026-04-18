"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginDirettoPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)
    setIsLoading(true)

    try {
      // Verifica se le variabili d'ambiente sono definite
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError("Variabili d'ambiente Supabase mancanti")
        setIsLoading(false)
        return
      }

      // Crea un client Supabase
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      // Chiama direttamente la funzione RPC
      const { data, error: rpcError } = await supabase.rpc("accessocipolla", {
        p_username: username,
        p_password: password,
      })

      if (rpcError) {
        setError(`Errore RPC: ${rpcError.message}`)
        setResult({ error: rpcError })
      } else if (data && data.length > 0) {
        const loginResult = data[0]
        setResult(loginResult)

        if (loginResult.success) {
          // Salva i dati dell'utente
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: loginResult.id,
              username: loginResult.username,
              ruolo: loginResult.ruolo,
            }),
          )

          // Imposta il cookie
          document.cookie = "auth_session=true; path=/; max-age=86400; SameSite=Strict"

          // Reindirizza
          router.push("/vendite/statistiche")
        } else {
          setError(loginResult.message || "Login fallito")
        }
      } else {
        setError("Nessun dato ricevuto dalla RPC")
        setResult({ data })
      }
    } catch (err: any) {
      setError(`Errore: ${err.message}`)
      setResult({ exception: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Login Diretto</h2>
          <p className="mt-2 text-sm text-gray-600">Questa pagina bypassa il contesto di autenticazione per test</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Nome utente
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Nome utente"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Risultato:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 text-center">
          <a href="/test" className="text-blue-500 hover:underline mr-4">
            Pagina di Test
          </a>
          <a href="/login" className="text-blue-500 hover:underline">
            Login Standard
          </a>
        </div>
      </div>
    </div>
  )
}
