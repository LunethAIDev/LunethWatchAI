import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedConfirmedTransaction, Commitment } from "@solana/web3.js"
import pLimit from "p-limit"

export interface TransferInstruction {
  signature: string
  slot: number
  tokenMint: string
  source: string
  destination: string
  amount: number
  fee: number
  blockTime: number | null
  status: "success" | "failed"
}

export interface BrainDiscoveryOptions {
  rpcUrl: string
  commitment?: Commitment
  concurrency?: number
  signatureLimit?: number
}

export class BrainDiscovery {
  private connection: Connection
  private limiter: <T>(fn: () => Promise<T>) => Promise<T>
  private signatureLimit: number

  constructor(options: BrainDiscoveryOptions) {
    this.connection = new Connection(options.rpcUrl, options.commitment ?? "confirmed")
    this.limiter = pLimit(options.concurrency ?? 10)
    this.signatureLimit = options.signatureLimit ?? 100
  }

  async fetchSignatures(address: string): Promise<ConfirmedSignatureInfo[]> {
    const pubkey = new PublicKey(address)
    try {
      return await this.connection.getSignaturesForAddress(pubkey, { limit: this.signatureLimit })
    } catch {
      console.error(`❌ Failed to fetch signatures for ${address}`)
      return []
    }
  }

  async fetchTransactions(signatures: ConfirmedSignatureInfo[]): Promise<ParsedConfirmedTransaction[]> {
    const tasks = signatures.map(sig =>
      this.limiter(async () => {
        return await this.connection.getParsedConfirmedTransaction(sig.signature)
      })
    )
    const results = await Promise.all(tasks)
    return results.filter((tx): tx is ParsedConfirmedTransaction => tx !== null)
  }

  extractTransferInstructions(transactions: ParsedConfirmedTransaction[]): TransferInstruction[] {
    const instructions: TransferInstruction[] = []
    for (const tx of transactions) {
      const { transaction, meta, slot, blockTime } = tx
      const fee = meta?.fee ?? 0
      const status = meta?.err ? "failed" : "success"
      for (const instr of transaction.message.instructions) {
        if ("parsed" in instr && instr.parsed.type === "transfer") {
          const info = instr.parsed.info
          instructions.push({
            signature: tx.transaction.signatures[0],
            slot,
            tokenMint: info.mint ?? "SOL",
            source: info.source,
            destination: info.destination,
            amount: Number(info.amount),
            fee,
            blockTime: blockTime ?? null,
            status
          })
        }
      }
    }
    return instructions
  }

  filterByMint(instructions: TransferInstruction[], mint: string): TransferInstruction[] {
    return instructions.filter(instr => instr.tokenMint === mint)
  }

  groupByDate(instructions: TransferInstruction[]): Record<string, TransferInstruction[]> {
    return instructions.reduce((acc, instr) => {
      const key = instr.blockTime
        ? new Date(instr.blockTime * 1000).toISOString().split("T")[0]
        : "unknown"
      if (!acc[key]) acc[key] = []
      acc[key].push(instr)
      return acc
    }, {} as Record<string, TransferInstruction[]>)
  }

  summarizeByDate(instructions: TransferInstruction[]): Record<string, { count: number; totalAmount: number; totalFees: number }> {
    const grouped = this.groupByDate(instructions)
    const summary: Record<string, { count: number; totalAmount: number; totalFees: number }> = {}
    for (const date in grouped) {
      const entries = grouped[date]
      summary[date] = {
        count: entries.length,
        totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
        totalFees: entries.reduce((sum, e) => sum + e.fee, 0)
      }
    }
    return summary
  }

  async analyzeAddress(address: string, mintFilter?: string) {
    const sigs = await this.fetchSignatures(address)
    const txs = await this.fetchTransactions(sigs)
    let instrs = this.extractTransferInstructions(txs)
    if (mintFilter) instrs = this.filterByMint(instrs, mintFilter)
    const byDate = this.groupByDate(instrs)
    const summary = this.summarizeByDate(instrs)
    return { raw: instrs, byDate, summary }
  }
}
