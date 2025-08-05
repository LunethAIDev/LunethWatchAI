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
  /** Max signatures to fetch (default 100) */
  limit?: number
  /** Concurrency for RPC calls (default 5) */
  concurrency?: number
  /** Ignore events before this timestamp (ms) */
  since?: number
}

/**
 * FlowShift tracks SPL-token transfer events for a given mint.
 */
export class FlowShift {
  private conn: Connection
  private queue: PQueue

  /**
   * @param rpcUrl  Solana RPC endpoint
   * @param opts    Default tracking options
   */
  constructor(rpcUrl: string, private opts: FlowShiftOptions = {}) {
    this.conn = new Connection(rpcUrl, "confirmed")
    this.queue = new PQueue({ concurrency: opts.concurrency ?? 5 })
  }

  /**
   * Track transfer events for `mint`
   * @param mint  SPL token mint address
   * @param overrideOpts  Options to override defaults
   */
  public async track(
    mint: string,
    overrideOpts: FlowShiftOptions = {}
  ): Promise<ShiftEvent[]> {
    const { limit = 100, since } = { ...this.opts, ...overrideOpts }
    const mintKey = new PublicKey(mint)

    // 1) Fetch recent signatures
    const sigInfos: ConfirmedSignatureInfo[] =
      await this.conn.getSignaturesForAddress(mintKey, { limit })

    const events: ShiftEvent[] = []

    // 2) Concurrently fetch & parse each transaction
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

    // 3) Sort by timestamp descending
    return events.sort((a, b) => b.timestamp - a.timestamp)
  }
}
