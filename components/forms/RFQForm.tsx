'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

const schema = z.object({
  title: z.string().min(5, 'Please provide a descriptive title'),
  materialCategory: z.string().min(1, 'Select a category'),
  materialSubcategory: z.string().optional(),
  quantityNeeded: z.string().min(1, 'Quantity required').refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  unit: z.string().min(1),
  targetPrice: z.string().optional(),
  deliveryLocation: z.string().optional(),
  description: z.string().min(20, 'Please provide more detail (min 20 chars)'),
})

type FormData = z.infer<typeof schema>

const UNIT_OPTIONS = [
  { value: 'TONS', label: 'Tons' },
  { value: 'LBS', label: 'Lbs' },
  { value: 'KG', label: 'Kg' },
  { value: 'PIECES', label: 'Pieces' },
  { value: 'LOT', label: 'Lot' },
]

const CATEGORY_OPTIONS = (Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]).map(
  ([value, label]) => ({ value, label })
)

interface RFQFormProps {
  onSuccess?: () => void
}

export function RFQForm({ onSuccess }: RFQFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'TONS' },
  })

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      quantityNeeded: Number(data.quantityNeeded),
      targetPrice: data.targetPrice ? Number(data.targetPrice) : undefined,
    }
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
      toast('RFQ posted — verified suppliers will reach out shortly.', { variant: 'success' })
      onSuccess?.()
    } catch {
      toast('Could not submit RFQ. Please try again.', { variant: 'error' })
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle size={36} className="text-[#2dba6e]" />
        <p className="font-semibold text-[var(--text-primary)]">RFQ Submitted!</p>
        <p className="text-sm text-[var(--text-tertiary)]">Verified suppliers will contact you directly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="RFQ Title"
        placeholder="e.g. Need 200 Tons HMS 1&2 — Midwest"
        error={errors.title?.message}
        {...register('title')}
      />

      <Select
        label="Material Category"
        options={CATEGORY_OPTIONS}
        placeholder="Select category…"
        error={errors.materialCategory?.message}
        {...register('materialCategory')}
      />

      <Input
        label="Subcategory / Grade"
        placeholder="e.g. HMS 1&2, #1 Copper, 304 SS…"
        {...register('materialSubcategory')}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Quantity"
            type="number"
            placeholder="500"
            error={errors.quantityNeeded?.message}
            {...register('quantityNeeded')}
          />
        </div>
        <Select
          label="Unit"
          options={UNIT_OPTIONS}
          {...register('unit')}
        />
      </div>

      <Input
        label="Target Price (per unit, optional)"
        type="number"
        placeholder="245.00"
        {...register('targetPrice')}
      />

      <Input
        label="Delivery Location"
        placeholder="Chicago, IL"
        {...register('deliveryLocation')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Description & Requirements
        </label>
        <textarea
          rows={4}
          placeholder="Describe your specifications, timeline, certifications needed…"
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 py-2 resize-none focus:border-[var(--accent)] focus:outline-none transition-colors"
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-[#c43a3a]">{errors.description.message}</p>}
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        Submit RFQ
      </Button>
    </form>
  )
}
