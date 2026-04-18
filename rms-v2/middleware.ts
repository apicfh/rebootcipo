import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Variabili d'ambiente Supabase mancanti nel middleware")
    // Se non ci sono le credenziali, salta l'autenticazione e lascia passare
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  const userAgent = request.headers.get("user-agent") || ""
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  let user = null
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // Se c'è un errore di refresh token, pulisci i cookie e considera l'utente non autenticato
    if (error) {
      if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
        // Pulisci tutti i cookie di autenticazione Supabase
        const cookiesToClear = request.cookies
          .getAll()
          .filter((cookie) => cookie.name.startsWith("sb-"))
          .map((cookie) => cookie.name)

        cookiesToClear.forEach((cookieName) => {
          response.cookies.delete(cookieName)
        })

        user = null
      } else {
        console.error("[v0] Errore nel middleware durante getSession:", error)
        user = null
      }
    } else {
      user = session?.user || null
    }
  } catch (error) {
    console.error("[v0] Eccezione nel middleware durante getSession:", error)
    user = null
  }

  // Percorsi pubblici che non richiedono autenticazione
  const publicPaths = ["/login"]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/")) {
    const redirectUrl = isMobile ? new URL("/mobile", request.url) : new URL("/vendite/statistiche", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
