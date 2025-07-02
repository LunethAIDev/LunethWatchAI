import { Connection, PublicKey } from "@solana/web3.js"

export class PriceTracker {
  private conn: Connection

  constructor(rpc: string) {
    this.conn = new Connection(rpc, "confirmed")
  }

  async getRecentPrices(mint: string, limit = 50): Promise<number[]> {
    const key = new PublicKey(mint)
    const sigs = await this.conn.getSignaturesForAddress(key, { limit })
    const prices: number[] = []
    for (const { signature } of sigs) {
      const tx = await this.conn.getParsedConfirmedTransaction(signature)
      const inst = tx?.transaction.message.instructions.find((i: any) => i.program === "spl-token-swap")
      if (inst && inst.parsed?.info?.amountIn && inst.parsed.info.amountOut) {
        const { amountIn, amountOut } = inst.parsed.info
        prices.push(amountOut / amountIn)
      }
    }
    return prices
  }
}
