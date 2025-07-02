
import express from "express"
import { XCoreProcessor } from "./xcoreProcessor"

const app = express()
app.use(express.json())

const processor = new XCoreProcessor(process.env.SOLANA_RPC_ENDPOINT!)

app.get("/xcore/:mint", async (req, res) => {
  try {
    const metrics = await processor.compute(req.params.mint)
    res.json({ success: true, data: metrics })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`XCore API listening on port ${process.env.PORT || 3000}`)
})
