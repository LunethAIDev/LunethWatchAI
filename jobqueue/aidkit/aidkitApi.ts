import express from "express"
import { AidKitService } from "./aidkitService"
import { AidKitAnalyzer } from "./aidkitAnalyzer"

const app = express()
app.use(express.json())

const service = new AidKitService(process.env.SOLANA_RPC_ENDPOINT!)
const analyzer = new AidKitAnalyzer()

app.post("/aidkit/analyze", async (req, res) => {
  try {
    const { mint, limit } = req.body
    const history = await service.fetchHistory(mint, limit)
    const metrics = analyzer.computeMetrics(history)
    res.json({ success: true, history, metrics })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.listen(process.env.PORT || 3000, () =>
  console.log(`AidKit API listening on port ${process.env.PORT || 3000}`)
)
