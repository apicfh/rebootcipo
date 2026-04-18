// DEPRECATO: Questa Server Action è stata sostituita da import-tripadvisor-reviews.ts
// Mantenuta solo per riferimento storico

"use server"

export async function importaRecensioniTripadvisor(
  hotelId: string,
  offset = 0,
  limit = 5,
  minNewReviews = 1,
  maxAttempts = 10,
) {
  return {
    success: false,
    message: "Server Action deprecata. Utilizzare import-tripadvisor-reviews.ts invece.",
    count: {
      total: 0,
      new: 0,
      existing: 0,
      error: 0,
    },
  }
}
