import express from "express"
import { DeepIntelService } from "./deepintelService"
import { DeepIntelAnalyzer } from "./deepintelAnalyzer"

const app = express()
app.use(express.json())

const svc = new DeepIntelService(process.env.SOLANA_RPC_ENDPOINT!)
const analyzer = new DeepIntelAnalyzer()

app.post("/deepintel/analyze", async (req, res) => {
  try {
    const { mint, limit, threshold } = req.body
    const series = await svc.fetchTimeSeries(mint, limit)
    const anomalies = analyzer.detectAnomalies(series, threshold)
    res.json({ success: true, series, anomalies })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

const port = parseInt(process.env.PORT || "3000")
app.listen(port, () => console.log(`DeepIntel API on port ${port}`))
