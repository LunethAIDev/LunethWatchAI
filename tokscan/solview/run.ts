
import dotenv from "dotenv"
import readline from "readline"
import { SolViewService } from "./solviewService"

dotenv.config()

const svc = new SolViewService(process.env.SOLANA_RPC_ENDPOINT!)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question("Enter token mint address: ", async (mint) => {
  try {
    const summary = await svc.summarizeToken(mint.trim())
    console.log("Token Summary:")
    console.log(`• Mint:         ${summary.mint}`)
    console.log(`• Total Supply: ${summary.totalSupply}`)
    console.log(`• Holder Count: ${summary.holderCount}`)
    console.log(`• Avg Balance:  ${summary.avgBalance.toFixed(4)}`)
  } catch (e: any) {
    console.error("Error:", e.message)
  } finally {
    rl.close()
  }
})
