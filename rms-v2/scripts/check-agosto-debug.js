// Script Node.js per verificare i dati di agosto
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variabili ambiente Supabase mancanti")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAgostoData() {
  console.log("🔍 Inizio verifica dati Agosto...\n")

  try {
    // 1. Check specifico per agosto
    console.log('📅 1. Verifica settimana "I Agosto"...')
    const { data: agostoData, error: agostoError } = await supabase.rpc("check_agosto_prezzi")

    if (agostoError) {
      console.error("❌ Errore check agosto:", agostoError)
    } else {
      console.log("✅ Risultati agosto:", JSON.stringify(agostoData, null, 2))
    }

    console.log("\n" + "=".repeat(50) + "\n")

    // 2. Check copertura completa Family Room
    console.log("🏨 2. Verifica copertura completa Family Room...")
    const { data: coverageData, error: coverageError } = await supabase.rpc("check_family_room_coverage")

    if (coverageError) {
      console.error("❌ Errore check copertura:", coverageError)
    } else {
      console.log("✅ Copertura Family Room:", JSON.stringify(coverageData, null, 2))
    }

    console.log("\n" + "=".repeat(50) + "\n")

    // 3. Debug dettagliato agosto
    console.log("🔬 3. Debug dettagliato agosto...")
    const { data: debugData, error: debugError } = await supabase.rpc("debug_agosto_specific")

    if (debugError) {
      console.error("❌ Errore debug agosto:", debugError)
    } else {
      console.log("✅ Debug agosto dettagliato:")
      debugData?.forEach((item) => {
        console.log(`\n--- ${item.debug_type.toUpperCase()} ---`)
        console.log(JSON.stringify(item.info, null, 2))
      })
    }

    console.log("\n" + "=".repeat(50) + "\n")

    // 4. Query diretta per verifica
    console.log("🎯 4. Query diretta prezzi_finale...")
    const { data: directData, error: directError } = await supabase
      .from("prezzi_finale")
      .select(`
        id,
        prezzo,
        stagione,
        valido_da,
        valido_a,
        settimane_soggiorno!inner(nome, inizio, fine),
        hotel!inner(nome),
        tipi_camere!inner(nome)
      `)
      .ilike("tipi_camere.nome", "%family%room%")
      .ilike("stagione", "%tosi_2025%")
      .ilike("settimane_soggiorno.nome", "%agosto%")

    if (directError) {
      console.error("❌ Errore query diretta:", directError)
    } else {
      console.log("✅ Query diretta risultati:", JSON.stringify(directData, null, 2))
    }
  } catch (error) {
    console.error("❌ Errore generale:", error)
  }
}

// Esegui il check
checkAgostoData()
