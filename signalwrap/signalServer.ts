import express from "express"
import { SignalFetcher } from "./signalFetcher"
import { SignalAnalyzer } from "./signalAnalyzer"
import { SignalEmitter } from "./signalEmitter"
import dotenv from "dotenv"

dotenv.config()
const app = express()
app.use(express.json())

const fetcher = new SignalFetcher(process.env.SOLANA_RPC_ENDPOINT!)
const analyzer = new SignalAnalyzer()
const emitter = new SignalEmitter()

app.post("/signal", async (req, res) => {
  try {
    const { mint, limit } = req.body
    const sigs = await fetcher.fetchTransfers(mint, limit)
    const txs = await Promise.all(
      sigs.map(s => fetcher["conn"].getParsedConfirmedTransaction(s.signature))
    )
    const details = await analyzer.parseDetails(txs.filter(Boolean) as any)
    const event = emitter.emit(mint, details)
    res.json({ success: true, event })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.listen(process.env.PORT || 3000, () =>
  console.log(`SignalWrap API on port ${process.env.PORT || 3000}`)
)
