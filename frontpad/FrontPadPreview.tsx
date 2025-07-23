import React, { useState, FormEvent } from "react" 
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input" 

interface FieldConfig {
  name: string
  type: React.HTMLInputTypeAttribute
}

interface FrontPadPreviewProps {
  title: string
  fields: FieldConfig[]
  onSubmit?: (values: Record<string, string>) => void
}

export const FrontPadPreview: React.FC<FrontPadPreviewProps> = ({ title, fields, onSubmit }) => {
  const [values, setValues] = useState<Record<string, string>>( 
    fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {})
  )

  const handleChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({ ...prev, [name]: e.target.value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSubmit) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {fields.map(f => (
        <div key={f.name}>
          <label htmlFor={f.name} className="block mb-1 font-medium">{f.name}</label>
          <Input
            id={f.name}
            type={f.type}
            value={values[f.name]}
            onChange={handleChange(f.name)}
            placeholder={f.name}
            className="w-full"
          />
        </div>
      ))}
      <Button type="submit" className="mt-4">
        Submit
      </Button>
    </form>
  )
}
