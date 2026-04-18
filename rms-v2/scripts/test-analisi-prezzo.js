import { createClient } from "@supabase/supabase-js"

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variabili ambiente Supabase mancanti")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAnalisiPrezzo() {
  console.log("🧪 Test funzione get_dati_analisi_prezzo")
  console.log("=".repeat(50))

  // Prima recupera i filtri disponibili per avere degli ID validi
  console.log("📋 Recupero filtri disponibili...")

  try {
    const { data: filtri, error: errorFiltri } = await supabase.rpc("get_filtri_analisi_prezzo")

    if (errorFiltri) {
      console.error("❌ Errore nel recupero filtri:", errorFiltri)
      return
    }

    if (!filtri || filtri.length === 0) {
      console.error("❌ Nessun filtro disponibile")
      return
    }

    const filtriData = filtri[0]
    console.log("✅ Filtri caricati:")
    console.log(`   - Hotels: ${filtriData.hotels?.length || 0}`)
    console.log(`   - Stagioni: ${filtriData.stagioni?.length || 0}`)
    console.log(`   - Settimane: ${filtriData.settimane?.length || 0}`)
    console.log(`   - Tipi Camera: ${filtriData.tipi_camere?.length || 0}`)

    // Prendi il primo hotel, prima settimana e primo tipo camera disponibili
    const primoHotel = filtriData.hotels?.[0]
    const primaSettimana = filtriData.settimane?.[0]
    const primaCamera = filtriData.tipi_camere?.[0]
    const primaStagione = filtriData.stagioni?.[0]

    if (!primoHotel || !primaSettimana || !primaCamera) {
      console.error("❌ Dati filtri insufficienti per il test")
      return
    }

    console.log("\n🎯 Parametri di test:")
    console.log(`   - Hotel: ${primoHotel.nome} (${primoHotel.id})`)
    console.log(`   - Settimana: ${primaSettimana.nome} (${primaSettimana.id})`)
    console.log(`   - Camera: ${primaCamera.nome} (${primaCamera.id})`)
    console.log(`   - Stagione: ${primaStagione?.stagione || "Non specificata"}`)

    // Test della funzione get_dati_analisi_prezzo
    console.log("\n📊 Test get_dati_analisi_prezzo...")

    const { data, error } = await supabase.rpc("get_dati_analisi_prezzo", {
      p_hotel_id: primoHotel.id,
      p_camera_id: primaCamera.id,
      p_settimana_id: primaSettimana.id,
      p_stagione: primaStagione?.stagione || null,
    })

    if (error) {
      console.error("❌ Errore nella chiamata RPC:", error)
      console.error("   Messaggio:", error.message)
      console.error("   Dettagli:", error.details)
      console.error("   Hint:", error.hint)
      return
    }

    console.log("✅ Chiamata RPC riuscita!")
    console.log("📊 Risultati:")

    if (!data || data.length === 0) {
      console.log("   ⚠️ Nessun dato restituito")
      return
    }

    const risultato = data[0]
    console.log(`   - Prezzi: ${risultato.prezzi?.length || 0} elementi`)
    console.log(`   - Prenotazioni: ${risultato.prenotazioni?.length || 0} elementi`)

    // Mostra dettagli prezzi
    if (risultato.prezzi && risultato.prezzi.length > 0) {
      console.log("\n💰 Primi 3 prezzi:")
      risultato.prezzi.slice(0, 3).forEach((prezzo, index) => {
        console.log(`   ${index + 1}. Data: ${prezzo.data}, Prezzo: €${prezzo.prezzo}, Stagione: ${prezzo.stagione}`)
      })
    } else {
      console.log("   ⚠️ Nessun prezzo trovato")
    }

    // Mostra dettagli prenotazioni
    if (risultato.prenotazioni && risultato.prenotazioni.length > 0) {
      console.log("\n📅 Prime 3 prenotazioni:")
      risultato.prenotazioni.slice(0, 3).forEach((pren, index) => {
        console.log(
          `   ${index + 1}. Settimana: ${pren.settimana_prenotazione}, Prenotazioni: ${pren.numero_prenotazioni}, Fatturato: €${pren.fatturato_totale}`,
        )
      })
    } else {
      console.log("   ⚠️ Nessuna prenotazione trovata")
    }

    console.log("\n✅ Test completato con successo!")
  } catch (err) {
    console.error("❌ Errore durante il test:", err)
  }
}

// Test con parametri specifici (opzionale)
async function testConParametriSpecifici() {
  console.log("\n🎯 Test con parametri specifici")
  console.log("=".repeat(50))

  // Inserisci qui degli ID specifici se li conosci
  const parametriTest = {
    hotel_id: "550e8400-e29b-41d4-a716-446655440000", // Sostituisci con un ID reale
    camera_id: "550e8400-e29b-41d4-a716-446655440001", // Sostituisci con un ID reale
    settimana_id: "550e8400-e29b-41d4-a716-446655440002", // Sostituisci con un ID reale
    stagione: "Estate", // Opzionale
  }

  try {
    const { data, error } = await supabase.rpc("get_dati_analisi_prezzo", {
      p_hotel_id: parametriTest.hotel_id,
      p_camera_id: parametriTest.camera_id,
      p_settimana_id: parametriTest.settimana_id,
      p_stagione: parametriTest.stagione,
    })

    if (error) {
      console.error("❌ Errore:", error.message)
      return
    }

    console.log("✅ Test parametri specifici riuscito!")
    console.log("📊 Dati:", JSON.stringify(data, null, 2))
  } catch (err) {
    console.error("❌ Errore test parametri specifici:", err)
  }
}

// Esegui i test
async function main() {
  await testAnalisiPrezzo()

  // Decommentare per testare con parametri specifici
  // await testConParametriSpecifici()
}

main().catch(console.error)
