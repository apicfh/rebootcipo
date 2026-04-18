"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, LogOut, ChevronLeft, Menu } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// Aggiungi l'interfaccia per gli hotel
interface HotelType {
  id: string
  nome: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [hotels, setHotels] = useState<HotelType[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "andamenti-hotel": false,
    "tabelle-performative": false,
    "analisi-prezzo": false,
    "pick-up": false,
  })

  // Funzione per recuperare gli hotel
  useEffect(() => {
    async function fetchHotels() {
      const { data } = await supabase.from("hotel").select("id, nome")
      if (data) {
        setHotels(data)
      }
    }

    fetchHotels()
  }, [])

  // Funzione per gestire l'apertura/chiusura dei menu
  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Errore durante il logout:", error)
    }
  }

  const menuItems = [
    {
      title: "Andamenti Hotel",
      id: "andamenti-hotel",
      iconPath: "https://sxaklykntkbxoopltgyz.supabase.co/storage/v1/object/public/images/cipolla%20grafici.png",
      hasSubmenu: true,
      submenu: hotels.map((hotel) => ({
        title: hotel.nome,
        href: `/vendite/statistiche/hotel/${hotel.id}`,
      })),
    },
    {
      title: "Tabelle Performative",
      id: "tabelle-performative",
      iconPath: "https://sxaklykntkbxoopltgyz.supabase.co/storage/v1/object/public/images/cipolla%20performance.png",
      hasSubmenu: true,
      submenu: [
        {
          title: "Totali Periodo",
          href: "/vendite/statistiche/totali-periodo",
        },
        {
          title: "Occupazione",
          href: "/vendite/statistiche/occupazione",
        },
        {
          title: "Domanda Provvisorio",
          href: "/vendite/statistiche/domanda-provvisorio",
        },
        {
          title: "Tabelle Performance",
          href: "/vendite/statistiche/tabelleperformance",
        },
      ],
    },
    {
      title: "Analisi Prezzo",
      id: "analisi-prezzo",
      iconPath: "https://sxaklykntkbxoopltgyz.supabase.co/storage/v1/object/public/images/cipolla%20prezzi.png",
      hasSubmenu: true,
      submenu: [
        {
          title: "Analisi Prezzo",
          href: "/vendite/statistiche/analisi-prezzo",
        },
        {
          title: "Scenari Previsionali",
          href: "/vendite/statistiche/scenari-previsionali",
        },
        {
          title: "Comparazione Prezzi",
          href: "/vendite/statistiche/comparazione-prezzi",
        },
        {
          title: "Listini",
          href: "/vendite/statistiche/listini",
        },
        {
          title: "Prezzi",
          href: "/prezzi/strategiaprezzi",
        },
      ],
    },
    {
      title: "Pick Up",
      id: "pick-up",
      iconPath: "https://sxaklykntkbxoopltgyz.supabase.co/storage/v1/object/public/images/cipolla%20grafici.png",
      hasSubmenu: false,
      href: "/vendite/statistiche/pick-up",
    },
    {
      title: "Predittivo",
      id: "predittivo",
      iconPath: "https://sxaklykntkbxoopltgyz.supabase.co/storage/v1/object/public/images/cipolla%20grafici.png",
      hasSubmenu: false,
      href: "/vendite/statistiche/predittivo",
    },
  ]

  return (
    <div
      className={`h-full border-r-2 border-secondary-300 bg-white shadow-md flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-72"}`}
    >
      <div className="p-4 border-b-2 border-secondary-300">
        {!isCollapsed && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-primary-700">Club Family Hotel</h2>
              <Link
                href="/opzioni2026"
                className="px-3 py-1.5 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors shadow-sm"
              >
                OPZIONI 2026
              </Link>
            </div>
            <Link
              href="/vendite/statistiche"
              className="text-sm text-muted-foreground hover:text-accent-500 hover:underline cursor-pointer transition-colors"
            >
              Statistiche
            </Link>
          </>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center justify-center w-full py-2 text-gray-600 hover:text-primary-700 hover:bg-secondary-100 rounded-md transition-colors ${isCollapsed ? "mt-0" : "mt-2"}`}
          title={isCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = !item.hasSubmenu && pathname === item.href
          const isSubmenuOpen = item.hasSubmenu && openMenus[item.id]
          const isSubmenuActive = item.hasSubmenu && item.submenu?.some((subItem) => pathname === subItem.href)

          return (
            <div key={item.hasSubmenu ? item.id : item.href}>
              {item.hasSubmenu ? (
                <>
                  <button
                    onClick={() => !isCollapsed && toggleMenu(item.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                      isSubmenuActive
                        ? "bg-primary-700 text-primary-foreground font-medium"
                        : "text-gray-700 hover:bg-secondary-100"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.title : ""}
                  >
                    <span className="flex items-center">
                      <div
                        className={`h-12 w-12 flex items-center justify-center flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`}
                      >
                        <img
                          src={item.iconPath || "/placeholder.svg"}
                          alt={item.title}
                          width={48}
                          height={48}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {!isCollapsed && <span className="truncate max-w-[120px]">{item.title}</span>}
                    </span>
                    {!isCollapsed &&
                      (isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                  </button>

                  {!isCollapsed && isSubmenuOpen && (
                    <div className="ml-14 mt-1 space-y-1">
                      {item.submenu?.map((subItem) => {
                        const isSubItemActive = pathname === subItem.href
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isSubItemActive
                                ? "bg-primary-700 text-primary-foreground font-medium"
                                : "text-gray-700 hover:bg-secondary-100"
                            }`}
                          >
                            <span className="truncate">{subItem.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? "bg-primary-700 text-primary-foreground font-medium"
                      : "text-gray-700 hover:bg-secondary-100"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.title : ""}
                >
                  <div
                    className={`h-12 w-12 flex items-center justify-center flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`}
                  >
                    <img
                      src={item.iconPath || "/placeholder.svg"}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  {!isCollapsed && <span className="truncate max-w-[120px]">{item.title}</span>}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t-2 border-secondary-300">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 ${isCollapsed ? "justify-center" : ""}`}
          title={isCollapsed ? "Esci" : ""}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && <span>Esci</span>}
        </button>
      </div>
    </div>
  )
}
