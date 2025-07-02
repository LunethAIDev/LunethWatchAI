import { Connection, PublicKey, ParsedAccountData } from "@solana/web3.js"

export interface CoreMetrics {
  totalSupply: number
  holderCount: number
  averageBalance: number
}

export class CoreEngine {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async fetchMetrics(mint: string): Promise<CoreMetrics> {
    const key = new PublicKey(mint)
    const resp = await this.conn.getParsedTokenAccountsByOwner(key, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    })
    const balances = resp.value.map(acc => {
      const info = (acc.account.data as ParsedAccountData).parsed.info.tokenAmount
      return Number(info.uiAmount)
    })
    const totalSupply = balances.reduce((s, b) => s + b, 0)
    const holderCount = balances.filter(b => b > 0).length
    const averageBalance = holderCount ? totalSupply / holderCount : 0
    return { totalSupply, holderCount, averageBalance }
  }
}
