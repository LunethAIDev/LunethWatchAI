import PQueue from "p-queue"
import {
  Connection,
  PublicKey,
  ParsedConfirmedTransaction,
  ConfirmedSignatureInfo,
} from "@solana/web3.js"

export interface ShiftEvent {
  from: string
  to: string
  mint: string
  amount: number
  signature: string
  timestamp: number
}

export interface FlowShiftOptions {
  limit?: number
  concurrency?: number
  since?: number
}

export class FlowShift {
  private conn: Connection
  private queue: PQueue

  constructor(rpcUrl: string, private opts: FlowShiftOptions = {}) {
    this.conn = new Connection(rpcUrl, "confirmed")
    this.queue = new PQueue({ concurrency: opts.concurrency ?? 5 })
  }

  public async track(
    mint: string,
    overrideOpts: FlowShiftOptions = {}
  ): Promise<ShiftEvent[]> {
    const { limit = 100, since } = { ...this.opts, ...overrideOpts }
    const mintKey = new PublicKey(mint)

    const sigInfos: ConfirmedSignatureInfo[] =
      await this.conn.getSignaturesForAddress(mintKey, { limit })

    const events: ShiftEvent[] = []

    await Promise.all(
      sigInfos.map(info =>
        this.queue.add(async () => {
          try {
            const tx: ParsedConfirmedTransaction | null =
              await this.conn.getParsedConfirmedTransaction(info.signature)
            if (!tx || !tx.blockTime) return

            const ts = tx.blockTime * 1000
            if (since && ts < since) return

            for (const ix of tx.transaction.message.instructions as any[]) {
              if (ix.program === "spl-token" && ix.parsed?.type === "transfer") {
                const { source, destination, mint: m, tokenAmount } = ix.parsed.info
                events.push({
                  from: source,
                  to: destination,
                  mint: m,
                  amount: Number(tokenAmount.uiAmount ?? 0),
                  signature: info.signature,
                  timestamp: ts,
                })
              }
            }
          } catch (err) {
            console.warn(`[FlowShift] error parsing ${info.signature}:`, err)
          }
        })
      )
    )

    return events.sort((a, b) => b.timestamp - a.timestamp)
  }
}
