import { Connection, PublicKey, ParsedConfirmedTransaction, ConfirmedSignatureInfo } from "@solana/web3.js"

export interface ShiftEvent {
  from: string
  to: string
  mint: string
  amount: number
  signature: string
}

export class FlowShift {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async track(mint: string, limit = 100): Promise<ShiftEvent[]> {
    const key = new PublicKey(mint)
    const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(key, { limit })
    const events: ShiftEvent[] = []

    for (const info of sigs) {
      const tx = await this.conn.getParsedConfirmedTransaction(info.signature)
      if (!tx) continue
      for (const instr of tx.transaction.message.instructions as any[]) {
        if (instr.program === "spl-token" && instr.parsed.type === "transfer") {
          const { source, destination, amount, mint: m } = instr.parsed.info
          events.push({
            from: source,
            to: destination,
            mint: m,
            amount: Number(amount),
            signature: info.signature
          })
        }
      }
    }

    return events
  }
}