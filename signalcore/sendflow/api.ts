import express from "express"
import { DataFetcher } from "./dataFetcher"
import { MetricsCalculator } from "./metricsCalculator"
import { PatternDetector } from "./patternDetector"
import { EventGenerator } from "./eventGenerator"

const app = express()
app.use(express.json())

const fetcher = new DataFetcher()
const calculator = new MetricsCalculator()
const detector = new PatternDetector()
const generator = new EventGenerator()

app.post("/analyze", async (req, res) => {
  try {
    const { mint, txs } = req.body
    const balances = await fetcher.balances(mint)
    const metrics = calculator.compute(balances)
    const details = detector.analyze(txs)
    const signal = generator.build(mint, details)
    res.json({ success: true, metrics, signal })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.listen(process.env.PORT || 3000)
