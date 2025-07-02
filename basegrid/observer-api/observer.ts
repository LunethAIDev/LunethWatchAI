
import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js"

export interface Observation {
  address: string
  signature: string
  slot: number
  timestamp: number
}

export class Observer {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async observe(address: string, limit = 10): Promise<Observation[]> {
    const key = new PublicKey(address)
    const sigs = await this.conn.getSignaturesForAddress(key, { limit })
    return sigs.map(s => ({
      address,
      signature: s.signature,
      slot: s.slot,
      timestamp: (s.blockTime ?? 0) * 1000
    }))
  }
}
