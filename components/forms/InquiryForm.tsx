'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  contactName: z.string().min(2, 'Name required'),
  contactEmail: z.string().email('Valid email required'),
  contactPhone: z.string().optional(),
  message: z.string().min(10, 'Please provide more detail'),
})

type FormData = z.infer<typeof schema>

interface InquiryFormProps {
  listingId: string
  toCompanyId: string
}

export function InquiryForm({ listingId, toCompanyId }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch('/api/listings/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, listingId, toCompanyId }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
      toast('Inquiry sent — the seller will be in touch shortly.', { variant: 'success' })
    } catch {
      toast('Could not send inquiry. Please try again.', { variant: 'error' })
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle size={32} className="text-[#2dba6e]" />
        <p className="text-sm font-medium text-[var(--text-primary)]">Inquiry Sent!</p>
        <p className="text-xs text-[var(--text-tertiary)]">The seller will contact you directly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input
        label="Your Name"
        placeholder="John Smith"
        error={errors.contactName?.message}
        {...register('contactName')}
      />
      <Input
        label="Email"
        type="email"
        placeholder="john@company.com"
        error={errors.contactEmail?.message}
        {...register('contactEmail')}
      />
      <Input
        label="Phone (optional)"
        type="tel"
        placeholder="+1 555 000 0000"
        {...register('contactPhone')}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Message
        </label>
        <textarea
          rows={3}
          placeholder="I'm interested in purchasing... quantity needed... delivery required..."
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 py-2 resize-none focus:border-[var(--accent)] focus:outline-none transition-colors"
          {...register('message')}
        />
        {errors.message && <p className="text-xs text-[#c43a3a]">{errors.message.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send Inquiry
      </Button>
      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Your contact info goes directly to the seller. No intermediaries.
      </p>
    </form>
  )
}
