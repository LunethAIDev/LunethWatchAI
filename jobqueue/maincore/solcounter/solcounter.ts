
import { Connection, PublicKey, ParsedConfirmedTransaction } from "@solana/web3.js"

export class SolCounter {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async countTransfers(address: string, limit = 100): Promise<number> {
    const pk = new PublicKey(address)
    const sigs = await this.conn.getSignaturesForAddress(pk, { limit })
    let count = 0

    for (const { signature } of sigs) {
      const tx = await this.conn.getParsedConfirmedTransaction(signature)
      if (!tx) continue

      for (const instr of tx.transaction.message.instructions as any[]) {
        if (
          instr.program === "system" &&
          instr.parsed?.type === "transfer" &&
          instr.parsed.info.lamports
        ) {
          count++
        }
      }
    }

    return count
  }
}
