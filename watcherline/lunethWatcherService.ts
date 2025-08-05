import PQueue from "p-queue"
import {
  Connection,
  PublicKey,
  ConfirmedSignatureInfo,
} from "@solana/web3.js"

export type TransactionCallback = (address: string, signature: string) => void

export interface LunethWatcherOptions {
  /** Polling interval in ms */
  intervalMs?: number
  /** How many signatures to fetch per address */
  fetchLimit?: number
  /** Concurrency for RPC calls */
  concurrency?: number
}

/**
 * Watches a set of Solana addresses for new confirmed transactions,
 * invoking registered callbacks for each new signature.
 */
export class LunethWatcherService {
  private conn: Connection
  private addresses = new Map<string, string>() // address → last signature
  private callbacks: TransactionCallback[] = []
  private queue: PQueue
  private timerId: NodeJS.Timeout | null = null
  private opts: Required<LunethWatcherOptions>

  constructor(rpcUrl: string, opts: LunethWatcherOptions = {}) {
    this.conn = new Connection(rpcUrl, "confirmed")
    this.opts = {
      intervalMs: opts.intervalMs ?? 10_000,
      fetchLimit: opts.fetchLimit ?? 5,
      concurrency: opts.concurrency ?? 5,
    }
    this.queue = new PQueue({ concurrency: this.opts.concurrency })
  }

  /**
   * Add an address to watch. Duplicate adds are ignored.
   */
  public addAddress(address: string): void {
    const addr = new PublicKey(address).toBase58()
    if (!this.addresses.has(addr)) {
      this.addresses.set(addr, "")
    }
  }

  /**
   * Remove an address from watching.
   */
  public removeAddress(address: string): void {
    const addr = new PublicKey(address).toBase58()
    this.addresses.delete(addr)
  }

  /**
   * Register a callback for new transactions.
   */
  public onTransaction(cb: TransactionCallback): void {
    this.callbacks.push(cb)
  }

  /**
   * Start polling loop.
   */
  public start(): void {
    if (this.timerId) return
    this.timerId = setInterval(() => this.poll(), this.opts.intervalMs)
    // immediate first poll
    void this.poll()
  }

  /**
   * Stop polling loop.
   */
  public stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  /** Internal: poll all addresses for new signatures */
  private async poll(): Promise<void> {
    for (const [addr, lastSig] of this.addresses.entries()) {
      this.queue.add(() => this.checkAddress(addr, lastSig)).catch(console.warn)
    }
    await this.queue.onIdle()
  }

  /** Internal: fetch and notify for one address */
  private async checkAddress(address: string, lastSig: string): Promise<void> {
    try {
      const pk = new PublicKey(address)
      const sigs: ConfirmedSignatureInfo[] =
        await this.conn.getSignaturesForAddress(pk, {
          limit: this.opts.fetchLimit,
        })

      let newestSig = lastSig
      for (const info of sigs) {
        if (info.signature === lastSig) break
        this.callbacks.forEach((cb) => cb(address, info.signature))
        newestSig = newestSig || info.signature
      }

      if (sigs.length && sigs[0].signature !== lastSig) {
        this.addresses.set(address, sigs[0].signature)
      }
    } catch (err) {
      console.error(`[LunethWatcher] error checking ${address}:`, err)
    }
  }
}
