import readline from "readline"
import { FormLink, FormDefinition } from "./formLink"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const service = new FormLink("./forms")

rl.question("Form title: ", title => {
  rl.question("Number of fields: ", async numStr => {
    const num = parseInt(numStr) || 0
    const fields: FormDefinition["fields"] = []
    const askField = (i: number) => {
      if (i >= num) {
        const link = service.generate({ title, fields })
        console.log("Form link:", link)
        rl.close()
        return
      }
      rl.question(`Field ${i + 1} name: `, name => {
        rl.question("Type (text/number): ", type => {
          rl.question("Required? (y/n): ", req => {
            fields.push({ name, type, required: req.toLowerCase().startsWith("y") })
            askField(i + 1)
          })
        })
      })
    }
    askField(0)
  })
})
