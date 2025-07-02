import React from "react"

interface FieldConfig {
  name: string
  type: string
}

interface FrontPadPreviewProps {
  title: string
  fields: FieldConfig[]
}

export const FrontPadPreview: React.FC<FrontPadPreviewProps> = ({ title, fields }) => {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {fields.map((f, i) => (
        <div key={i}>
          <label className="block mb-1 font-medium">{f.name}</label>
          <input
            type={f.type}
            placeholder={f.name}
            className="w-full border rounded p-2"
          />
        </div>
      ))}
      <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Submit
      </button>
    </div>
  )
}
