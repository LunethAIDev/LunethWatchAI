import { ParsedConfirmedTransaction } from "@solana/web3.js"

export interface TransferDetail {
  signature: string
  from: string
  to: string
  amount: number
}

export class SignalAnalyzer {
  async parseDetails(
    txs: ParsedConfirmedTransaction[]
  ): Promise<TransferDetail[]> {
    const details: TransferDetail[] = []
    for (const tx of txs) {
      const sig = tx.transaction.signatures[0]
      for (const instr of tx.transaction.message.instructions as any[]) {
        if (instr.program === "spl-token" && instr.parsed?.type === "transfer") {
          const info = instr.parsed.info
          details.push({
            signature: sig,
            from: info.source,
            to: info.destination,
            amount: Number(info.amount)
          })
        }
      }
    }
    return details
  }

  computeVolume(details: TransferDetail[]): number {
    return details.reduce((sum, d) => sum + d.amount, 0)
  }
}
