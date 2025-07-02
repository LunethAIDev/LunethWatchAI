import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js"

export class SignalFetcher {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async fetchTransfers(mint: string, limit = 100): Promise<ConfirmedSignatureInfo[]> {
    const key = new PublicKey(mint)
    return this.conn.getSignaturesForAddress(key, { limit })
  }
}
