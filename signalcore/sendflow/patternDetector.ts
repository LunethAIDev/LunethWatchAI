import { ParsedConfirmedTransaction } from "@solana/web3.js"

export interface Event {
  type: string
  signature: string
  amount: number
}

export class PatternDetector {
  analyze(txs: ParsedConfirmedTransaction[]): Event[] {
    const events: Event[] = []
    for (const tx of txs) {
      const sig = tx.transaction.signatures[0]
      for (const instr of tx.transaction.message.instructions as any[]) {
        if (instr.program === "spl-token" && instr.parsed?.type === "transfer") {
          const { amount } = instr.parsed.info
          events.push({ type: "transfer", signature: sig, amount: Number(amount) })
        }
      }
    }
    return events
  }
}
