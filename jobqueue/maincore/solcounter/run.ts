
import readline from "readline"
import { SolCounter } from "./solcounter"

const rpc = process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"
const counter = new SolCounter(rpc)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question("Enter wallet address: ", async (addr) => {
  try {
    const total = await counter.countTransfers(addr.trim(), 200)
    console.log(`SOL transfers in recent transactions: ${total}`)
  } catch (e: any) {
    console.error("Error:", e.message)
  } finally {
    rl.close()
  }
})
