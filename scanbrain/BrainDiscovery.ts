import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js"

export class BrainDiscovery {
  private conn: Connection

  constructor(rpc: string) {
    this.conn = new Connection(rpc, "confirmed")
  }

  async fetchTransfers(mint: string, limit = 100): Promise<ConfirmedSignatureInfo[]> {
    const key = new PublicKey(mint)
    return this.conn.getSignaturesForAddress(key, { limit })
  }
}
