import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedTransactionWithMeta } from "@solana/web3.js"

export interface Observation {
  address: string
  signature: string
  slot: number
  timestamp: number
}

export interface DetailedObservation extends Observation {
  parsedTransaction: ParsedTransactionWithMeta | null
}

/**
 * Observer is responsible for fetching recent transaction
 * signatures and optionally detailed transaction data for a given address.
 */
export class Observer {
  private conn: Connection

  constructor(rpcUrl: string, commitment: "confirmed" | "finalized" = "confirmed") {
    this.conn = new Connection(rpcUrl, commitment)
  }

  /**
   * Fetches recent signatures for the specified address.
   * @param address - base58 public key string
   * @param limit - maximum number of signatures to fetch
   * @returns array of Observation objects
   */
  public async observe(address: string, limit = 10): Promise<Observation[]> {
    try {
      const key = new PublicKey(address)
      const sigs = await this.conn.getSignaturesForAddress(key, { limit })
      return sigs.map((s: ConfirmedSignatureInfo) => ({
        address,
        signature: s.signature,
        slot: s.slot,
        timestamp: (s.blockTime ?? 0) * 1000
      }))
    } catch (error) {
      console.error("Error fetching signatures:", error)
      throw error
    }
  }

  /**
   * Fetches detailed transaction data for each signature.
   * @param address - base58 public key string
   * @param limit - maximum number of recent transactions to fetch
   * @returns array of DetailedObservation objects
   */
  public async observeWithDetails(address: string, limit = 10): Promise<DetailedObservation[]> {
    const observations = await this.observe(address, limit)
    const detailed: DetailedObservation[] = []

    for (const obs of observations) {
      try {
        const txn = await this.conn.getParsedTransaction(obs.signature, { maxSupportedTransactionVersion: 0 })
        detailed.push({
          ...obs,
          parsedTransaction: txn
        })
      } catch (error) {
        console.warn(`Failed to fetch details for ${obs.signature}:`, error)
        detailed.push({
          ...obs,
          parsedTransaction: null
        })
      }
    }

    return detailed
  }

  /**
   * Paginates through confirmed signatures for a given address.
   * @param address - base58 public key string
   * @param pageSize - number of items per page
   * @param pages - number of pages to retrieve
   * @returns nested array of Observation pages
   */
  public async paginateObservations(address: string, pageSize = 10, pages = 1): Promise<Observation[][]> {
    const key = new PublicKey(address)
    let before: string | undefined = undefined
    const result: Observation[][] = []

    for (let i = 0; i < pages; i++) {
      try {
        const options: any = { limit: pageSize }
        if (before) options.before = before
        const sigs = await this.conn.getSignaturesForAddress(key, options)
        const obsPage = sigs.map((s: ConfirmedSignatureInfo) => ({
          address,
          signature: s.signature,
          slot: s.slot,
          timestamp: (s.blockTime ?? 0) * 1000
        }))
        if (sigs.length === 0) break
        before = sigs[sigs.length - 1].signature
        result.push(obsPage)
      } catch (error) {
        console.error("Pagination error:", error)
        break
      }
    }

    return result
  }
}
