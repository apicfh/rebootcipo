# RPC deployate su Supabase senza file SQL locale

Queste funzioni sono attive e chiamate dal frontend ma non hanno un file `.sql` corrispondente.
Sono documentate qui a partire dalle chiamate nel codice sorgente.

---

## Auth

### `accessocipolla`
**File:** `app/login-diretto/page.tsx`
**Params:** `{ p_username: string, p_password: string }`
**Returns:** `[{ success: boolean, ... }]`
**Note:** Sistema di login custom (non Supabase Auth). Verifica credenziali sulla tabella `accessicipolla`.

---

## Studio Revenue

### `studiorevenue_get_stagionitariffarie`
**File:** `app/studiorevenue/page.tsx`
**Params:** nessuno
**Returns:** array di `StagioneTariffaria[]` (id, nome, data_inizio, data_fine, tipo_stagione)
**Note:** Restituisce tutte le stagioni tariffarie da `rev.stagioni_tariffarie`.

### `studiorevenue_recupera_prenotazioni_card`
**File:** `app/studiorevenue/page.tsx`
**Params:** `{ p_hotel_id: uuid, p_includi_cancellazioni: boolean }`
**Returns:** array prenotazioni con campi per calcolo KPI (id, arrivo, partenza, totale_soggiorno, stato, notti, data_prenotazione, id_hotel)
**Note:** `.limit(1000000)` — restituisce tutte le prenotazioni dell'hotel. Base per KPI studiorevenue.

---

## Telefonate — KPI Prenotazioni

### `rpc_conversioni_catia_prenotazioni_kpi`
**File:** `app/telefonate/page.tsx:229`
**Params:** `{ data_inizio: string, data_fine: string, id_hotel_filter: uuid | null }`
**Returns:** `[{ ...kpi_prenotazioni }]` — un solo record con KPI aggregati
**Note:** KPI prenotazioni per la sezione conversioni della pagina telefonate.

### `rpc_conversioni_catia_telefonate_automatico`
**File:** `app/telefonate/page.tsx:292`
**Params:** `{ data_inizio: string, data_fine: string }` (data_inizio estesa a -X giorni)
**Returns:** array telefonate automatico con campi per analisi conversione

---

## Telefonate — Inbound

### `get_inbound_catia`
**File:** `app/telefonate/page.tsx:766`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** array chiamate inbound nel periodo

### `get_inbound_catia_by_number`
**File:** `app/telefonate/page.tsx:915`
**Params:** `{ numero_hotel: string, data_inizio: string, data_fine: string }`
**Returns:** array chiamate inbound filtrate per numero hotel

### `get_inbound_coda_distribution_by_number`
**File:** `app/telefonate/page.tsx:929`
**Params:** `{ numero_hotel: string, data_inizio: string, data_fine: string }`
**Returns:** distribuzione per coda del numero hotel

### `get_inbound_conversion_analysis_by_number`
**File:** `app/telefonate/page.tsx:943`
**Params:** `{ numero_hotel: string, data_inizio: string, data_fine: string }`
**Returns:** array `{ categoria: string, ... }` — analisi conversione per categoria

### `get_hotel_numbers_catia`
**File:** `app/telefonate/page.tsx:778`
**Params:** nessuno
**Returns:** lista numeri hotel per dropdown filtro

---

## Telefonate — Outbound

### `get_outbound_catia`
**File:** `app/telefonate/page.tsx:772`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** array chiamate outbound nel periodo

### `get_operatori_outbound_list`
**File:** `app/telefonate/page.tsx:839`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** lista operatori outbound attivi nel periodo

### `get_operatore_outbound_max_chiamate`
**File:** `app/telefonate/page.tsx:858`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** operatore outbound con più chiamate

### `get_operatore_outbound_max_rapporto`
**File:** `app/telefonate/page.tsx:859`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** operatore outbound con miglior rapporto chiamate/conversioni

### `get_operatore_outbound_max_durata_totale`
**File:** `app/telefonate/page.tsx:860`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** operatore outbound con durata totale maggiore

### `get_operatore_outbound_min_durata_media`
**File:** `app/telefonate/page.tsx:861`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** operatore outbound con durata media minore (più efficiente)

### `get_operatore_outbound_max_durata_media`
**File:** `app/telefonate/page.tsx:862`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** operatore outbound con durata media maggiore

### `get_operatore_outbound_statistiche`
**File:** `app/telefonate/page.tsx:1080`
**Params:** `{ profilo_senza_sigla_agente: string, data_inizio: string, data_fine: string }`
**Returns:** `[{ ...statistiche_outbound }]` — un record con statistiche operatore outbound

### `get_operatore_outbound_serie_temporale`
**File:** `app/telefonate/page.tsx:1095`
**Params:** `{ profilo_senza_sigla_agente: string, data_inizio: string, data_fine: string }`
**Returns:** array serie temporale chiamate outbound dell'operatore

---

## Telefonate — Operatori Inbound (detail)

### `get_operatori_list_optimized`
**File:** `app/telefonate/page.tsx:814`
**Params:** `{ data_inizio: string, data_fine: string }`
**Returns:** lista operatori inbound con JOIN su `Agenti Youneed`

### `get_operatore_statistiche_optimized`
**File:** `app/telefonate/page.tsx:1002`
**Params:** `{ profilo_agente: string, data_inizio: string, data_fine: string }`
**Returns:** `[{ ...statistiche_operatore }]` — un record con statistiche complete operatore inbound

### `get_operatore_coda_distribution_optimized`
**File:** `app/telefonate/page.tsx:1017`
**Params:** `{ profilo_agente: string, data_inizio: string, data_fine: string }`
**Returns:** distribuzione per coda dell'operatore

### `get_operatore_serie_temporale_optimized`
**File:** `app/telefonate/page.tsx:1032`
**Params:** `{ profilo_agente: string, data_inizio: string, data_fine: string }`
**Returns:** serie temporale chiamate dell'operatore

### `get_operatore_distribuzione_oraria_optimized`
**File:** `app/telefonate/page.tsx:1047`
**Params:** `{ profilo_agente: string, data_inizio: string, data_fine: string }`
**Returns:** distribuzione oraria chiamate dell'operatore

---

## Telefonate — Conversioni Area

### `conversioni_area_get_breakdown`
**File:** `app/telefonate/page.tsx:532`
**Params:** vedi chiamata
**Returns:** breakdown conversioni per area geografica

### `conversioni_area_get_dettaglio`
**File:** `app/telefonate/page.tsx:559`
**Params:** vedi chiamata
**Returns:** dettaglio conversioni per area

---

## Domanda

### `get_domanda_stats`
**File:** `app/vendite/statistiche/domanda/page.tsx:153`
**Params:** oggetto `params` con filtri (hotel, date, ecc.)
**Returns:** statistiche domanda per il periodo

---

*Ultimo aggiornamento: 2026-04-18*
