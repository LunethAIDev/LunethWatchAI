import { Connection, PublicKey, ParsedAccountData } from "@solana/web3.js"

export class DataFetcher {
  conn = new Connection(process.env.SOLANA_RPC_ENDPOINT!, "confirmed")

  async balances(mint: string) {
    const key = new PublicKey(mint)
    const resp = await this.conn.getParsedTokenAccountsByOwner(key, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    })
    return resp.value.map(acc => {
      const info = (acc.account.data as ParsedAccountData).parsed.info.tokenAmount
      return Number(info.uiAmount)
    })
  }
}
