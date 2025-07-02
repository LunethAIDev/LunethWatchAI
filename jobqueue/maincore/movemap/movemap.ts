
import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js"

export interface Movement {
  from: string
  to: string
  amount: number
  signature: string
}

export class MoveMap {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async extract(mint: string, limit = 100): Promise<Movement[]> {
    const key = new PublicKey(mint)
    const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(key, { limit })
    const moves: Movement[] = []

    for (const { signature } of sigs) {
      const tx = await this.conn.getParsedConfirmedTransaction(signature)
      if (!tx) continue
      for (const instr of tx.transaction.message.instructions as any[]) {
        if (instr.program === "spl-token" && instr.parsed?.type === "transfer") {
          const info = instr.parsed.info
          moves.push({
            from: info.source,
            to: info.destination,
            amount: Number(info.amount),
            signature
          })
        }
      }
    }

    return moves
  }

  summarize(moves: Movement[]): Record<string, number> {
    const tally: Record<string, number> = {}
    for (const { from, to, amount } of moves) {
      const key = `${from}->${to}`
      tally[key] = (tally[key] || 0) + amount
    }
    return tally
  }
}
