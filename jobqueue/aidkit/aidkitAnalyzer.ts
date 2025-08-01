import pLimit from "p-limit"
import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js"

export interface TimeBucket {
  hour: number
  txCount: number
  avgVolume: number
}

export interface HeatmapReport {
  mint: string
  peakHours: number[]
  buckets: TimeBucket[]
}

/**
 * Options for heatmap generation
 */
export interface HeatmapOptions {
  /** How many signatures to fetch (default: 500) */
  signatureLimit?: number
  /** Hours back from now to include (default: 24) */
  hoursBack?: number
  /** Concurrency for RPC calls (default: 5) */
  concurrency?: number
}

/**
 * Generates activity heatmap for a given SPL token mint.
 * Calculates transaction counts and average tx volume per hour.
 *
 * @param connection   Solana RPC connection
 * @param mintAddress  Token mint address (base58)
 * @param opts         Heatmap options
 */
export async function generateTokenActivityHeatmap(
  connection: Connection,
  mintAddress: string,
  opts: HeatmapOptions = {}
): Promise<HeatmapReport> {
  const {
    signatureLimit = 500,
    hoursBack = 24,
    concurrency = 5,
  } = opts

  if (signatureLimit < 1 || hoursBack < 1 || concurrency < 1) {
    throw new RangeError("signatureLimit, hoursBack, and concurrency must be >= 1")
  }

  const mintPubkey = new PublicKey(mintAddress)
  const nowSec = Math.floor(Date.now() / 1000)
  const sinceSec = nowSec - hoursBack * 3600

  // 1) fetch recent signatures
  const sigs: ConfirmedSignatureInfo[] = await connection.getSignaturesForAddress(
    mintPubkey,
    { limit: signatureLimit }
  )

  // 2) prepare hourly buckets
  const bucketsMap: Record<number, { count: number; volumes: number[] }> = {}
  for (let h = 0; h < 24; h++) {
    bucketsMap[h] = { count: 0, volumes: [] }
  }

  // 3) filter and group by hour; collect signatures
  const recentSigs = sigs.filter(s => s.blockTime && s.blockTime >= sinceSec)
  for (const sig of recentSigs) {
    const hour = new Date(sig.blockTime! * 1000).getUTCHours()
    bucketsMap[hour].count += 1
  }

  // 4) fetch transactions in parallel to compute volumes
  const limit = pLimit(concurrency)
  await Promise.all(
    recentSigs.map(sig =>
      limit(async () => {
        try {
          const tx = await connection.getParsedConfirmedTransaction(sig.signature)
          if (!tx) return
          const instructions = tx.transaction.message.instructions as (ParsedInstruction | PartiallyDecodedInstruction)[]
          let volume = 0
          for (const instr of instructions) {
            const parsed = (instr as ParsedInstruction).parsed
            // count SPL-token transfer volumes
            if (
              parsed?.type === "transfer" &&
              (instr as any).program === "spl-token"
            ) {
              const info = parsed.info.tokenAmount.uiAmount
              volume += Number(info || 0)
            }
          }
          const hour = new Date(sig.blockTime! * 1000).getUTCHours()
          bucketsMap[hour].volumes.push(volume)
        } catch {
          // ignore failures
        }
      })
    )
  )

  // 5) build final buckets
  const buckets: TimeBucket[] = []
  for (let h = 0; h < 24; h++) {
    const { count, volumes } = bucketsMap[h]
    const avgVolume =
      count > 0 && volumes.length > 0
        ? parseFloat((volumes.reduce((a, b) => a + b, 0) / volumes.length).toFixed(2))
        : 0
    buckets.push({ hour: h, txCount: count, avgVolume })
  }

  // 6) determine peak hours
  const maxCount = Math.max(...buckets.map(b => b.txCount))
  const peakHours = buckets.filter(b => b.txCount === maxCount).map(b => b.hour)

  return {
    mint: mintPubkey.toBase58(),
    peakHours,
    buckets,
  }
}
