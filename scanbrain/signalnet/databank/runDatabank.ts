import readline from "readline"
import { DataBank } from "./dataBank"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const db = new DataBank()

function menu() {
  console.log(`
1) Add record
2) Get records
3) Clear key
4) Clear all
5) Exit
`)
  rl.question("Choose: ", handle)
}

async function handle(choice: string) {
  switch (choice.trim()) {
    case "1":
      rl.question("Key: ", key =>
        rl.question("Value (JSON): ", json => {
          try {
            const val = JSON.parse(json)
            db.add(key.trim(), val)
            console.log("Added")
          } catch {
            console.log("Invalid JSON")
          }
          menu()
        })
      )
      return
    case "2":
      rl.question("Key: ", key => {
        console.log(db.get(key.trim()))
        menu()
      })
      return
    case "3":
      rl.question("Key to clear: ", key => {
        db.clear(key.trim())
        console.log("Cleared key")
        menu()
      })
      return
    case "4":
      db.clear()
      console.log("Cleared all")
      menu()
      return
    case "5":
      rl.close()
      return
    default:
      console.log("Invalid")
      menu()
  }
}

menu()
