import React, { useState } from "react"

interface FrontPadFormProps {
  onSubmit: (config: { title: string; fields: { name: string; type: string }[] }) => void
}

export const FrontPadForm: React.FC<FrontPadFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState("")
  const [fields, setFields] = useState<{ name: string; type: string }[]>([])

  const addField = () => {
    setFields([...fields, { name: "", type: "text" }])
  }

  const updateField = (index: number, key: "name" | "type", value: string) => {
    const updated = fields.slice()
    updated[index] = { ...updated[index], [key]: value }
    setFields(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, fields })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div>
        <label className="block mb-1 font-medium">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter form title"
          className="w-full border rounded p-2"
        />
      </div>

      {fields.map((f, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <input
            value={f.name}
            onChange={e => updateField(i, "name", e.target.value)}
            placeholder="Field name"
            className="border rounded p-2"
          />
          <select
            value={f.type}
            onChange={e => updateField(i, "type", e.target.value)}
            className="border rounded p-2"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Field
      </button>

      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Create Form
      </button>
    </form>
  )
}
