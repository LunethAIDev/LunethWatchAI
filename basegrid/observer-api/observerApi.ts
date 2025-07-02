
import express from "express"
import { Observer } from "./observer"

const app = express()
app.use(express.json())

const observer = new Observer(process.env.SOLANA_RPC_ENDPOINT!)

app.post("/observe", async (req, res) => {
  try {
    const { address, limit } = req.body
    if (!address) {
      return res.status(400).json({ success: false, error: "address is required" })
    }
    const data = await observer.observe(address, limit)
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(process.env.PORT || 3000, () =>
  console.log(`Observer API listening on port ${process.env.PORT || 3000}`)
)
