
import express from "express"
import { FlowShift } from "./flowshift"

const app = express()
app.use(express.json())

const shift = new FlowShift(process.env.SOLANA_RPC_ENDPOINT!)

app.post("/flowshift", async (req, res) => {
  try {
    const { mint, limit } = req.body
    const events = await shift.track(mint, limit || 100)
    res.json({ success: true, events })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(process.env.PORT || 3000, () =>
  console.log(`FlowShift API listening on port ${process.env.PORT || 3000}`)
)
