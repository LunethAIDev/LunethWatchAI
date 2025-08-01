// server.ts

import express, { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { BrainDiscovery } from "./BrainDiscovery"
import { BrainMetrics } from "./BrainMetrics"
import { BrainNotifier } from "./BrainNotifier"

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT
if (!RPC_ENDPOINT) {
  throw new Error("SOLANA_RPC_ENDPOINT must be set")
}

const discovery = new BrainDiscovery(RPC_ENDPOINT)
const metricsCalc = new BrainMetrics()
const notifier = new BrainNotifier()

// Zod schema for request body
const scanBrainSchema = z.object({
  mint: z.string().min(32, "mint must be a valid base58 string"),
  limit: z.number().int().positive().max(1000).optional().default(100),
})

type ScanBrainInput = z.infer<typeof scanBrainSchema>

const app = express()
app.use(express.json())

// Error-handling middleware
function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err)
  if (err instanceof z.ZodError) {
    return res.status(400).json({ success: false, errors: err.errors })
  }
  res.status(500).json({ success: false, error: err.message || "Internal server error" })
}

app.post(
  "/scanbrain",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: ScanBrainInput = scanBrainSchema.parse(req.body)

      // 1) fetch recent transfer signatures
      const sigs = await discovery.fetchTransfers(input.mint, input.limit)

      // 2) fetch and filter parsed transactions in parallel
      const txPromises = sigs.map(s =>
        discovery.getConnection().getParsedConfirmedTransaction(s.signature)
      )
      const txs = (await Promise.all(txPromises)).filter(Boolean)

      // 3) compute metrics and evaluate alerts
      const metrics = metricsCalc.compute(txs)
      const alerts = notifier.evaluate(metrics)

      res.json({ success: true, metrics, alerts })
    } catch (err) {
      next(err)
    }
  }
)

app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`⚡ Brain scanner listening on port ${PORT}`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down…")
  server.close(() => process.exit(0))
})
