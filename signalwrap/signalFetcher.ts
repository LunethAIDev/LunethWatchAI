import PQueue from "p-queue"
import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedConfirmedTransaction } from "@solana/web3.js"

export interface TransferInfo {
  signature: string
  timestamp: number
  source: string
  destination: string
  amount: number
  mint: string
}

/**
 * Fetches and parses recent SPL token transfer events for a given mint.
 */
export class TransferFetcher {
  private conn: Connection
  private queue: PQueue

  /**
   * @param rpcUrl       Solana RPC endpoint
   * @param concurrency  Number of parallel RPC calls (default 5)
   */
  constructor(rpcUrl: string, concurrency = 5) {
    this.conn = new Connection(rpcUrl, "confirmed")
    this.queue = new PQueue({ concurrency })
  }

  /**
   * Fetch raw signature infos for the token mint's associated token account(s)
   * @param mint      Mint address of the SPL token
   * @param limit     Max number of signatures to fetch
   */
  public async fetchSignatures(mint: string, limit = 100): Promise<ConfirmedSignatureInfo[]> {
    const mintPk = new PublicKey(mint)
    return this.conn.getSignaturesForAddress(mintPk, { limit })
  }

  /**
   * Fetch and decode transfer events, filtering only "transfer" instructions
   */
  public async fetchTransfers(mint: string, limit = 100): Promise<TransferInfo[]> {
    const sigInfos = await this.fetchSignatures(mint, limit)
    const transfers: TransferInfo[] = []

    await Promise.all(
      sigInfos.map(info =>
        this.queue.add(async () => {
          const tx = await this.conn.getParsedConfirmedTransaction(info.signature)
          if (!tx?.transaction?.message || !tx.meta) return

          const ts = (tx.blockTime ?? Date.now() / 1000) * 1000
          for (const ix of tx.transaction.message.instructions) {
            const instr = ix as any
            if (instr.program === "spl-token" && instr.parsed?.type === "transfer") {
              const { info } = instr.parsed
              transfers.push({
                signature: info.authority || info.source,
                timestamp: ts,
                source: info.source,
                destination: info.destination,
                amount: Number(info.tokenAmount.uiAmount || 0),
                mint,
              })
            }
          }
        })
      )
    )

    // sort by timestamp descending
    return transfers.sort((a, b) => b.timestamp - a.timestamp)
  }
}
