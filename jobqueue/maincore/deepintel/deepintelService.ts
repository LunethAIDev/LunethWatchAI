import { Connection, PublicKey, ParsedAccountData, ConfirmedSignatureInfo } from "@solana/web3.js"

export interface TimePoint {
  timestamp: number
  volume: number
  price: number
  liquidity: number
}

export class DeepIntelService {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async fetchTimeSeries(mint: string, limit = 200): Promise<TimePoint[]> {
    const key = new PublicKey(mint)
    const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(key, { limit })
    const series: TimePoint[] = []

    for (const { signature, blockTime } of sigs) {
      if (!blockTime) continue
      const tx = await this.conn.getParsedConfirmedTransaction(signature)
      if (!tx) continue

      // very basic proxy for volume/liquidity based on token-account balances
      const accounts = await this.conn.getParsedTokenAccountsByOwner(key, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      })
      const balances = accounts.value.map(acc => {
        const info = (acc.account.data as ParsedAccountData).parsed.info.tokenAmount
        return Number(info.uiAmount)
      })
      const total = balances.reduce((s, v) => s + v, 0)

      series.push({
        timestamp: blockTime * 1000,
        volume: tx.transaction.message.instructions.length,
        price: tx.meta?.postBalances[0] ?? 0,
        liquidity: total
      })
    }

    return series.sort((a, b) => a.timestamp - b.timestamp)
  }
}
