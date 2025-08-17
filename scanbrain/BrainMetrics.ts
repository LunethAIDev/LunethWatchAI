import {
  ParsedConfirmedTransaction,
  ParsedInstruction,
} from "@solana/web3.js"

export interface Metrics {
  totalVolume: number
  uniqueSenders: number
  uniqueReceivers: number
}

export class BrainMetrics {
  compute(transactions: ParsedConfirmedTransaction[]): Metrics {
    const senders = new Set<string>()
    const receivers = new Set<string>()
    let totalVolume = 0

    for (const tx of transactions) {
      const instructions = tx.transaction.message.instructions as ParsedInstruction[]

      for (const instr of instructions) {
        // Ensure it's a parsed SPL-token transfer
        if (
          instr.program !== "spl-token" ||
          instr.parsed?.type !== "transfer" ||
          !instr.parsed?.info
        ) {
          continue
        }

        const { source, destination, amount } = instr.parsed.info

        // Defensive checks
        if (typeof source !== "string" || typeof destination !== "string") continue

        senders.add(source)
        receivers.add(destination)

        const numericAmount = Number(amount)
        if (!isNaN(numericAmount)) {
          totalVolume += numericAmount
        }
      }
    }

    return {
      totalVolume,
      uniqueSenders: senders.size,
      uniqueReceivers: receivers.size,
    }
  }
}
