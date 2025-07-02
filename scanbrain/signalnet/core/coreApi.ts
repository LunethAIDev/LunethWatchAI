import express from "express"
import { CoreEngine } from "./coreEngine"

const app = express()
app.use(express.json())

const engine = new CoreEngine(process.env.SOLANA_RPC_ENDPOINT!)

app.get("/core/metrics/:mint", async (req, res) => {
  try {
    const metrics = await engine.fetchMetrics(req.params.mint)
    res.json({ success: true, data: metrics })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Core API listening on port ${port}`))
