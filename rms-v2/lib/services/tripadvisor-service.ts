/**
 * Client per l'API di Tripadvisor
 */

// L'URL base per l'API di Tripadvisor Content API
const TRIPADVISOR_API_BASE_URL = "https://api.content.tripadvisor.com/api/v1"

type TripadvisorOptions = {
  limit?: number
  language?: string
  currency?: string
}

export type TripadvisorReview = {
  id: string
  title: string
  text: string
  rating: number
  published_date: string
  user: {
    username: string
    avatar?: {
      small: string
      large: string
    }
  }
}

export type TripadvisorLocation = {
  location_id: string
  name: string
  description?: string
  web_url?: string
  address_obj?: {
    street1?: string
    city?: string
    country?: string
    postalcode?: string
  }
  rating?: number
  num_reviews?: number
  ranking_data?: {
    ranking_position?: number
    ranking_denominator?: number
    geo_location_name?: string
  }
  photo?: {
    images?: {
      small?: { url?: string }
      medium?: { url?: string }
      large?: { url?: string }
    }
  }
}

// Modifica la funzione getTripadvisorReviews per utilizzare la nostra API route invece di chiamare direttamente l'API di Tripadvisor

/**
 * Recupera le recensioni di una struttura da Tripadvisor
 * @param locationId ID della struttura su Tripadvisor
 * @param options Opzioni per la richiesta
 */
export async function getTripadvisorReviews(
  locationId: string,
  options: TripadvisorOptions = {},
): Promise<TripadvisorReview[]> {
  const { limit = 10, language = "it" } = options

  try {
    // Utilizziamo la nostra API route invece di chiamare direttamente l'API di Tripadvisor
    const response = await fetch(
      `/api/tripadvisor/reviews?locationId=${locationId}&limit=${limit}&language=${language}`,
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor (${response.status}):`, errorText)
      throw new Error(`Errore API Tripadvisor: ${response.statusText}`)
    }

    const data = await response.json()
    return data.reviews || []
  } catch (error) {
    console.error("Errore nel recupero delle recensioni Tripadvisor:", error)
    throw error // Rilanciamo l'errore per gestirlo nel componente
  }
}

/**
 * Recupera i dettagli di una struttura da Tripadvisor
 * @param locationId ID della struttura su Tripadvisor
 * @param options Opzioni per la richiesta
 */
export async function getTripadvisorLocation(
  locationId: string,
  options: TripadvisorOptions = {},
): Promise<TripadvisorLocation | null> {
  const { language = "it", currency = "EUR" } = options

  try {
    const apiKey = process.env.TRIPADVISOR_API_KEY

    if (!apiKey) {
      console.error("API key di Tripadvisor non configurata")
      return null
    }

    const response = await fetch(
      `${TRIPADVISOR_API_BASE_URL}/location/${locationId}/details?key=${apiKey}&language=${language}&currency=${currency}&include=ranking_data`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor (${response.status}):`, errorText)
      throw new Error(`Errore API Tripadvisor: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Errore nel recupero dei dettagli Tripadvisor:", error)
    return null
  }
}

/**
 * Cerca strutture su Tripadvisor
 * @param query Termine di ricerca
 * @param options Opzioni per la richiesta
 */
export async function searchTripadvisorLocations(
  query: string,
  options: TripadvisorOptions = {},
): Promise<TripadvisorLocation[]> {
  const { limit = 10, language = "it" } = options

  try {
    const apiKey = process.env.TRIPADVISOR_API_KEY

    if (!apiKey) {
      console.error("API key di Tripadvisor non configurata")
      return []
    }

    // Endpoint per la ricerca di location
    const response = await fetch(
      `${TRIPADVISOR_API_BASE_URL}/location/search?key=${apiKey}&searchQuery=${encodeURIComponent(query)}&language=${language}&limit=${limit}&category=hotels`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor (${response.status}):`, errorText)
      throw new Error(`Errore API Tripadvisor: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Errore nella ricerca Tripadvisor:", error)
    return []
  }
}

/**
 * Recupera le foto di una struttura da Tripadvisor
 * @param locationId ID della struttura su Tripadvisor
 * @param options Opzioni per la richiesta
 */
export async function getTripadvisorPhotos(locationId: string, options: TripadvisorOptions = {}): Promise<any[]> {
  const { limit = 10 } = options

  try {
    const apiKey = process.env.TRIPADVISOR_API_KEY

    if (!apiKey) {
      console.error("API key di Tripadvisor non configurata")
      return []
    }

    const response = await fetch(
      `${TRIPADVISOR_API_BASE_URL}/location/${locationId}/photos?key=${apiKey}&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor (${response.status}):`, errorText)
      throw new Error(`Errore API Tripadvisor: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Errore nel recupero delle foto Tripadvisor:", error)
    return []
  }
}

// Modifica anche la funzione getLocationReviews per gestire meglio gli errori
/**
 * Recupera le recensioni di una struttura da Tripadvisor
 * Alias per getTripadvisorReviews per compatibilità
 * @param locationId ID della struttura su Tripadvisor
 * @param limit Numero massimo di recensioni da recuperare
 */
export async function getLocationReviews(locationId: string, limit = 5): Promise<TripadvisorReview[]> {
  try {
    return await getTripadvisorReviews(locationId, { limit })
  } catch (error) {
    console.error("Errore in getLocationReviews:", error)
    throw error // Rilanciamo l'errore per gestirlo nel componente
  }
}
