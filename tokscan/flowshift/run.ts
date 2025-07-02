import readline from "readline"
import { FlowShift } from "./flowshift"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const rpc = process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"
const shift = new FlowShift(rpc)

rl.question("Token mint to observe: ", async (mint) => {
  try {
    const events = await shift.track(mint.trim(), 50)
    console.log("FlowShift Events:")
    events.forEach(e => {
      console.log(`${e.signature}: ${e.from} → ${e.to}, ${e.amount} of ${e.mint}`)
    })
  } catch (err: any) {
    console.error("Error:", err.message)
  } finally {
    rl.close()
  }
})