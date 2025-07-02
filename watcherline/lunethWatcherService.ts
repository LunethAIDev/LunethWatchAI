
import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js"

export type TransactionCallback = (address: string, signature: string) => void

export class LunethWatcherService {
  private conn: Connection
  private addresses: PublicKey[] = []
  private lastSignatures: Record<string, string> = {}
  private callbacks: TransactionCallback[] = []

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, "confirmed")
  }

  addAddress(address: string): void {
    this.addresses.push(new PublicKey(address))
    this.lastSignatures[address] = ""
  }

  onTransaction(cb: TransactionCallback): void {
    this.callbacks.push(cb)
  }

  private async poll(): Promise<void> {
    for (const pk of this.addresses) {
      const addr = pk.toBase58()
      const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(pk, { limit: 5 })
      for (const s of sigs) {
        if (s.signature === this.lastSignatures[addr]) break
        this.callbacks.forEach(cb => cb(addr, s.signature))
      }
      if (sigs[0]) this.lastSignatures[addr] = sigs[0].signature
    }
  }

  start(intervalMs = 10000): void {
    this.poll().catch(() => null)
    setInterval(() => this.poll().catch(() => null), intervalMs)
  }
}
