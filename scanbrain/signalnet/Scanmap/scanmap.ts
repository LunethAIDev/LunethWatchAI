import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js"

export interface TransferEdge {
  from: string
  to: string
  count: number
}

export class ScanMap {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  async fetchTransfers(mint: string, limit = 200): Promise<{ from: string; to: string }[]> {
    const key = new PublicKey(mint)
    const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(key, { limit })
    const pairs: { from: string; to: string }[] = []

    for (const { signature } of sigs) {
      const tx = await this.conn.getParsedConfirmedTransaction(signature)
      if (!tx) continue
      for (const instr of tx.transaction.message.instructions as any[]) {
        if (instr.program === "spl-token" && instr.parsed?.type === "transfer") {
          const { source, destination } = instr.parsed.info
          pairs.push({ from: source, to: destination })
        }
      }
    }

    return pairs
  }

  buildGraph(pairs: { from: string; to: string }[]): TransferEdge[] {
    const tally: Record<string, number> = {}
    for (const { from, to } of pairs) {
      const key = `${from}->${to}`
      tally[key] = (tally[key] || 0) + 1
    }
    return Object.entries(tally).map(([k, count]) => {
      const [from, to] = k.split("->")
      return { from, to, count }
    })
  }

  async analyze(mint: string): Promise<TransferEdge[]> {
    const pairs = await this.fetchTransfers(mint)
    return this.buildGraph(pairs)
  }
}
