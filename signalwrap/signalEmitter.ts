import { TransferDetail } from "./signalAnalyzer"

export interface SignalEvent {
  mint: string
  totalVolume: number
  transfers: TransferDetail[]
  generatedAt: number
}

export class SignalEmitter {
  emit(mint: string, transfers: TransferDetail[]): SignalEvent {
    const volume = transfers.reduce((s, t) => s + t.amount, 0)
    return {
      mint,
      totalVolume: volume,
      transfers,
      generatedAt: Date.now()
    }
  }
}
