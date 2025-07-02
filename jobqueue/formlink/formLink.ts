import crypto from "crypto"
import fs from "fs"
import path from "path"

export interface FormDefinition {
  title: string
  fields: { name: string; type: string; required: boolean }[]
}

export class FormLink {
  private storageDir: string

  constructor(storageDir: string = process.cwd()) {
    this.storageDir = storageDir
    fs.mkdirSync(this.storageDir, { recursive: true })
  }

  generate(def: FormDefinition): string {
    const id = crypto.randomBytes(8).toString("hex")
    const file = path.join(this.storageDir, `${id}.json`)
    fs.writeFileSync(file, JSON.stringify(def, null, 2))
    return `https://forms.luneth.watch/${id}`
  }

  load(id: string): FormDefinition | null {
    try {
      const file = path.join(this.storageDir, `${id}.json`)
      const data = fs.readFileSync(file, "utf-8")
      return JSON.parse(data)
    } catch {
      return null
    }
  }
}
