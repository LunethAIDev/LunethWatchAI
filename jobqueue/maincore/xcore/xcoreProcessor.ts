
import { Connection, PublicKey, ParsedAccountData } from "@solana/web3.js"

export interface XCoreMetrics {
  supply: number
  holders: number
  averageBalance: number
}

export class XCoreProcessor {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async compute(mint: string): Promise<XCoreMetrics> {
    const key = new PublicKey(mint)
    const resp = await this.conn.getParsedTokenAccountsByOwner(key, {
      programId: new PublicKey()
    })
    const balances = resp.value.map(acc => {
      const info = (acc.account.data as ParsedAccountData).parsed.info.tokenAmount
      return Number(info.uiAmount)
    })
    const supply = balances.reduce((s, b) => s + b, 0)
    const holders = balances.filter(b => b > 0).length
    const averageBalance = holders ? supply / holders : 0
    return { supply, holders, averageBalance }
  }
}
