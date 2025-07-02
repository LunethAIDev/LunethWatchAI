import { Connection, PublicKey, ParsedAccountData, ConfirmedSignatureInfo } from "@solana/web3.js"

export interface TimePoint {
  timestamp: number
  volume: number
  liquidity: number
}

export class AidKitService {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async fetchHistory(mint: string, limit = 200): Promise<TimePoint[]> {
    const key = new PublicKey(mint)
    const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(key, { limit })
    const history: TimePoint[] = []

    for (const { signature, blockTime } of sigs) {
      if (!blockTime) continue
      const tx = await this.conn.getParsedConfirmedTransaction(signature)
      if (!tx) continue

      const accounts = await this.conn.getParsedTokenAccountsByOwner(key, {
        programId: new PublicKey()
      })
      const balances = accounts.value.map(acc => {
        const info = (acc.account.data as ParsedAccountData).parsed.info.tokenAmount
        return Number(info.uiAmount)
      })
      const total = balances.reduce((s, v) => s + v, 0)

      history.push({
        timestamp: blockTime * 1000,
        volume: tx.transaction.message.instructions.length,
        liquidity: total
      })
    }

    return history.sort((a, b) => a.timestamp - b.timestamp)
  }
}
