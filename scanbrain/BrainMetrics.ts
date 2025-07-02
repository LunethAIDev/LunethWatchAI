import { ParsedConfirmedTransaction } from "@solana/web3.js"

export interface Metrics {
  totalVolume: number
  uniqueSenders: number
  uniqueReceivers: number
}

export class BrainMetrics {
  compute(transactions: ParsedConfirmedTransaction[]): Metrics {
    const senders = new Set<string>()
    const receivers = new Set<string>()
    let volume = 0

    for (const tx of transactions) {
      const sig = tx.transaction.signatures[0]
      for (const instr of tx.transaction.message.instructions as any[]) {
        if (instr.program === "spl-token" && instr.parsed?.type === "transfer") {
          const info = instr.parsed.info
          senders.add(info.source)
          receivers.add(info.destination)
          volume += Number(info.amount)
        }
      }
    }

    return {
      totalVolume: volume,
      uniqueSenders: senders.size,
      uniqueReceivers: receivers.size
    }
  }
}
