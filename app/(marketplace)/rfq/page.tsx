'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { Navbar } from '@/components/navigation/Navbar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

const schema = z.object({
  title: z.string().min(5, 'Title required'),
  materialCategory: z.string().min(1, 'Category required'),
  materialSubcategory: z.string().optional(),
  quantityNeeded: z.string().min(1, 'Quantity required'),
  unit: z.string().min(1),
  targetPrice: z.string().optional(),
  deliveryLocation: z.string().optional(),
  description: z.string().min(20, 'Please provide more detail'),
})

type FormData = z.infer<typeof schema>
const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]
const UNITS = ['TONS', 'LBS', 'KG', 'PIECES', 'LOT']

export default function RFQPage() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'TONS' },
  })

  const onSubmit = async (data: FormData) => {
    await fetch('/api/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={48} className="text-[#2dba6e]" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">RFQ Submitted!</h2>
            <p className="text-[var(--text-secondary)] max-w-sm">
              Your request for quotation has been posted. Verified sellers will reach out directly.
            </p>
            <Button asChild><a href="/browse">Browse Listings</a></Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Post a Request for Quote</h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8">
            Describe what you need and verified suppliers will contact you directly with quotes.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="animate-hero p-6 rounded flex flex-col gap-5"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <Input
              label="RFQ Title"
              placeholder="e.g. Need 500 Tons HMS Steel — Chicago Area"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Material Category
              </label>
              <select
                className="h-9 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
                {...register('materialCategory')}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map(([cat, label]) => (
                  <option key={cat} value={cat}>{label}</option>
                ))}
              </select>
              {errors.materialCategory && <p className="text-xs text-[#c43a3a]">{errors.materialCategory.message}</p>}
            </div>

            <Input
              label="Subcategory / Grade (optional)"
              placeholder="e.g. HMS 1&2, Bare Bright, 304 SS..."
              {...register('materialSubcategory')}
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Quantity Needed"
                  type="number"
                  placeholder="500"
                  error={errors.quantityNeeded?.message}
                  {...register('quantityNeeded')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Unit</label>
                <select
                  className="h-9 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
                  {...register('unit')}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <Input
              label="Target Price (optional)"
              type="number"
              placeholder="245.00 per unit"
              {...register('targetPrice')}
            />

            <Input
              label="Delivery Location"
              placeholder="Chicago, IL or ZIP code"
              {...register('deliveryLocation')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Description & Requirements
              </label>
              <textarea
                rows={5}
                placeholder="Describe specifications, delivery timeline, any certifications needed, and any other relevant requirements..."
                className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 py-2 resize-none focus:border-[var(--accent)] focus:outline-none"
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-[#c43a3a]">{errors.description.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} size="lg" className="mt-2">
              Submit RFQ
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
