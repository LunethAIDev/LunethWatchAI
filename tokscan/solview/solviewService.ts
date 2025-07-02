
import { Connection, PublicKey, ParsedAccountData } from "@solana/web3.js"

export interface TokenSummary {
  mint: string
  totalSupply: number
  holderCount: number
  avgBalance: number
}

export class SolViewService {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async summarizeToken(mint: string): Promise<TokenSummary> {
    const key = new PublicKey(mint)
    const resp = await this.conn.getParsedTokenAccountsByOwner(key, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    })

    const balances = resp.value.map(acc => {
      const info = (acc.account.data as ParsedAccountData).parsed.info.tokenAmount
      return Number(info.uiAmount)
    })

    const totalSupply = balances.reduce((sum, b) => sum + b, 0)
    const holderCount = balances.filter(b => b > 0).length
    const avgBalance = holderCount ? totalSupply / holderCount : 0

    return { mint, totalSupply, holderCount, avgBalance }
  }
}
