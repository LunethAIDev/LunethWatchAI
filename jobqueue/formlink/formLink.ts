import crypto from "crypto"
import fs from "fs/promises"
import path from "path"
import { z } from "zod"

export interface FormField {
  name: string
  type: string
  required: boolean
}

export interface FormDefinition {
  title: string
  fields: FormField[]
}

const FormDefinitionSchema = z.object({
  title: z.string().min(1),
  fields: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        required: z.boolean(),
      })
    )
    .min(1),
})
export type FormDefinition = z.infer<typeof FormDefinitionSchema>

export class FormLink {
  private storageDir: string
  private host: string

  /**
   * @param storageDir  Directory to store form JSON files
   * @param host        Base URL for generated links (e.g. https://forms.example.com)
   */
  constructor(
    storageDir: string = process.cwd(),
    host: string = "https://forms.luneth.watch"
  ) {
    this.storageDir = storageDir
    this.host = host.replace(/\/+$/, "")
    // ensure directory exists
    fs.mkdir(this.storageDir, { recursive: true }).catch(console.error)
  }

  /**
   * Generate a new form link, saving definition to disk.
   * @throws if definition is invalid
   */
  public async generate(def: unknown): Promise<string> {
    // validate
    const parsed = FormDefinitionSchema.parse(def)
    const id = crypto.randomBytes(8).toString("hex")
    const filePath = path.join(this.storageDir, `${id}.json`)
    const payload = JSON.stringify({
      ...parsed,
      _createdAt: new Date().toISOString(),
    }, null, 2)
    await fs.writeFile(filePath, payload, "utf-8")
    return `${this.host}/${id}`
  }

  /**
   * Load a saved form definition by ID.
   * @returns the definition or null if not found or invalid
   */
  public async load(id: string): Promise<FormDefinition | null> {
    try {
      const filePath = path.join(this.storageDir, `${id}.json`)
      const raw = await fs.readFile(filePath, "utf-8")
      const obj = JSON.parse(raw)
      // strip metadata before validating
      const { title, fields } = obj
      return FormDefinitionSchema.parse({ title, fields })
    } catch {
      return null
    }
  }

  /**
   * Delete a form by ID.
   * @returns true if deleted, false if not found
   */
  public async delete(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.storageDir, `${id}.json`)
      await fs.unlink(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * List all saved form IDs.
   */
  public async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storageDir)
      return files
        .filter(f => f.endsWith(".json"))
        .map(f => path.basename(f, ".json"))
    } catch {
      return []
    }
  }
}
