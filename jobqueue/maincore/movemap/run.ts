
import readline from "readline"
import { MoveMap } from "./movemap"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const rpc = process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"
const map = new MoveMap(rpc)

rl.question("Token mint to map movements: ", async (mint) => {
  try {
    const moves = await map.extract(mint.trim(), 50)
    const summary = map.summarize(moves)
    console.log("Movement Summary:")
    for (const [path, amt] of Object.entries(summary)) {
      console.log(`${path}: ${amt}`)
    }
  } catch (e: any) {
    console.error("Error:", e.message)
  } finally {
    rl.close()
  }
})
