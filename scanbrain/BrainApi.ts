import express from "express"
import { BrainDiscovery } from "./BrainDiscovery"
import { BrainMetrics } from "./BrainMetrics"
import { BrainNotifier } from "./BrainNotifier"

const app = express()
app.use(express.json())

const rpc = process.env.SOLANA_RPC_ENDPOINT!
const discovery = new BrainDiscovery(rpc)
const metricsCalc = new BrainMetrics()
const notifier = new BrainNotifier()

app.post("/scanbrain", async (req, res) => {
  try {
    const { mint, limit } = req.body
    const sigs = await discovery.fetchTransfers(mint, limit || 100)
    const txs = await Promise.all(
      sigs.map(s => discovery["conn"].getParsedConfirmedTransaction(s.signature))
    )
    const valid = txs.filter(Boolean) as any
    const metrics = metricsCalc.compute(valid)
    const alerts = notifier.evaluate(metrics)
    res.json({ success: true, metrics, alerts })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.listen(process.env.PORT || 3000)
