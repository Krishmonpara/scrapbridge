'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Upload, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

const LISTING_TYPES = [
  { value: 'SELL', label: 'Selling', desc: 'I have materials to sell' },
  { value: 'BUY', label: 'Buying', desc: 'I want to purchase materials' },
  { value: 'WANTED', label: 'Wanted', desc: 'Looking for specific items' },
  { value: 'AUCTION', label: 'Auction', desc: 'Open competitive bidding' },
]

const CONDITIONS = [
  { value: 'COMPLETE', label: 'Complete', desc: 'Fully intact, all parts present' },
  { value: 'PARTIAL', label: 'Partial', desc: 'Some parts missing or removed' },
  { value: 'DAMAGED', label: 'Damaged', desc: 'Visible damage, still functional' },
  { value: 'AS_IS', label: 'As-Is', desc: 'No warranties, sold as found' },
  { value: 'SCRAP_ONLY', label: 'Scrap Only', desc: 'Material value only' },
]

const UNITS = ['TONS', 'LBS', 'KG', 'PIECES', 'LOT']
const UNIT_LABELS: Record<string, string> = { TONS: 'Tons', LBS: 'Lbs', KG: 'Kg', PIECES: 'Pieces', LOT: 'Lot' }
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const STEPS = ['Type & Category', 'Material Details', 'Quantity & Price', 'Location', 'Photos & Desc', 'Review & Submit']
const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs mt-1" style={{ color: '#ef4444' }}>
      <AlertCircle size={11} /> {msg}
    </p>
  )
}

export default function PostListingPage() {
  const [step, setStep] = useState(0)
  const [listingType, setListingType] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [unit, setUnit] = useState('TONS')
  const [negotiable, setNegotiable] = useState(false)
  const [pickup, setPickup] = useState(true)
  const [delivery, setDelivery] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [demoCompanyId, setDemoCompanyId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Record<string, string>>({})

  // Load a demo company ID for the form (replaces session-based lookup in prod)
  useEffect(() => {
    fetch('/api/companies?limit=1')
      .then((r) => r.json())
      .then((data) => {
        const first = data?.companies?.[0] ?? data?.[0]
        if (first?.id) setDemoCompanyId(first.id)
      })
      .catch(() => {})
  }, [])

  const validate = (currentStep: number): boolean => {
    const errs: Record<string, string> = {}
    if (currentStep === 0) {
      if (!listingType) errs.listingType = 'Select a listing type'
      if (!category) errs.category = 'Select a material category'
    }
    if (currentStep === 1) {
      if (!formData.title?.trim()) errs.title = 'Title is required'
      if (!condition) errs.condition = 'Select a condition'
    }
    if (currentStep === 2) {
      if (!formData.quantity || isNaN(Number(formData.quantity))) errs.quantity = 'Valid quantity is required'
    }
    if (currentStep === 3) {
      if (!formData.city?.trim()) errs.city = 'City is required'
      if (!formData.state) errs.state = 'State is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validate(step)) setStep((s) => Math.min(s + 1, 5))
  }
  const prev = () => {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validate(step)) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload: Record<string, unknown> = {
        companyId: demoCompanyId ?? 'demo',
        listingType,
        title: formData.title,
        materialCategory: category,
        materialSubcategory: formData.subcategory || undefined,
        grade: formData.grade || undefined,
        condition,
        quantity: Number(formData.quantity),
        unit,
        pricePerUnit: formData.price ? Number(formData.price) : undefined,
        currency: 'USD',
        negotiable,
        minOrder: formData.minOrder ? Number(formData.minOrder) : undefined,
        description: formData.description || undefined,
        specs: formData.specs || undefined,
        city: formData.city,
        state: formData.state,
        country: 'US',
        pickupAvailable: pickup,
        deliveryAvailable: delivery,
        status: 'ACTIVE',
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? `Server error ${res.status}`)
      }

      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center flex flex-col items-center gap-4"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(45,186,110,0.12)', border: '1px solid rgba(45,186,110,0.3)' }}
            >
              <Check size={32} className="text-[#2dba6e]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Listing Submitted!</h2>
            <p className="text-[var(--text-secondary)]">Your listing has been posted and is now live.</p>
            <div className="flex items-center gap-3">
              <Button variant="secondary" asChild>
                <Link href="/my-listings">My Listings</Link>
              </Button>
              <Button asChild>
                <Link href="/browse">Browse Listings</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Progress bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Post a Listing</h1>
              <span className="text-sm text-[var(--text-tertiary)]">Step {step + 1} of {STEPS.length}</span>
            </div>
            <div className="flex gap-1">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
                />
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              {STEPS.map((s, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className={`text-xs ${i === step ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              {/* Step 0: Type & Category */}
              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">What are you listing?</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {LISTING_TYPES.map(({ value, label, desc }) => (
                        <button
                          key={value}
                          onClick={() => setListingType(value)}
                          className="flex flex-col gap-1 p-4 rounded text-left transition-all duration-150"
                          style={{
                            background: listingType === value ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                            border: `1px solid ${listingType === value ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                        >
                          <span className="font-semibold text-sm" style={{ color: listingType === value ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {label}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">{desc}</span>
                        </button>
                      ))}
                    </div>
                    <FieldError msg={errors.listingType} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Select material category</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES.map(([cat, label]) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className="flex items-center gap-2 p-3 rounded text-left transition-all duration-150"
                          style={{
                            background: category === cat ? 'var(--accent-glow)' : 'var(--bg-primary)',
                            border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                        >
                          <span className="text-[var(--accent)]">
                            <MaterialIcon category={cat} size={16} />
                          </span>
                          <span className="text-xs" style={{ color: category === cat ? 'var(--accent)' : 'var(--text-secondary)' }}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <FieldError msg={errors.category} />
                  </div>
                </div>
              )}

              {/* Step 1: Material Details */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Material Details</h2>
                  <div>
                    <Input
                      label="Listing Title *"
                      placeholder="e.g. 500 Tons HMS 1&2 Mixed Steel — Detroit, MI"
                      value={formData.title ?? ''}
                      onChange={e => setFormData((f) => ({ ...f, title: e.target.value }))}
                    />
                    <FieldError msg={errors.title} />
                  </div>
                  <Input
                    label="Material Subcategory"
                    placeholder="e.g. HMS 1&2, Bare Bright, #2 Copper..."
                    value={formData.subcategory ?? ''}
                    onChange={e => setFormData((f) => ({ ...f, subcategory: e.target.value }))}
                  />
                  <Input
                    label="Grade / Specification"
                    placeholder="e.g. ISRI Grade 200, A36, 304L..."
                    value={formData.grade ?? ''}
                    onChange={e => setFormData((f) => ({ ...f, grade: e.target.value }))}
                  />
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Condition *</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CONDITIONS.map(({ value, label, desc }) => (
                        <button
                          key={value}
                          onClick={() => setCondition(value)}
                          className="flex flex-col gap-0.5 p-3 rounded-sm text-left transition-all"
                          style={{
                            background: condition === value ? 'var(--accent-glow)' : 'var(--bg-primary)',
                            border: `1px solid ${condition === value ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: condition === value ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {label}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">{desc}</span>
                        </button>
                      ))}
                    </div>
                    <FieldError msg={errors.condition} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Technical Specs</label>
                    <textarea
                      rows={4}
                      placeholder="Weight: 500 tons&#10;Dimensions: bulk&#10;Alloy: mixed ferrous&#10;Contaminants: none"
                      className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 py-2 resize-none focus:border-[var(--accent)] focus:outline-none"
                      value={formData.specs ?? ''}
                      onChange={e => setFormData((f) => ({ ...f, specs: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Quantity & Price */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quantity & Pricing</h2>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        label="Quantity *"
                        type="number"
                        placeholder="500"
                        value={formData.quantity ?? ''}
                        onChange={e => setFormData((f) => ({ ...f, quantity: e.target.value }))}
                      />
                      <FieldError msg={errors.quantity} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Unit</label>
                      <select
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        className="h-9 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Price Per Unit (USD)"
                    type="number"
                    placeholder="245.00"
                    value={formData.price ?? ''}
                    onChange={e => setFormData((f) => ({ ...f, price: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={negotiable} onChange={e => setNegotiable(e.target.checked)} className="accent-[var(--accent)]" />
                    <span className="text-sm text-[var(--text-secondary)]">Price is negotiable (OBO)</span>
                  </label>
                  <Input
                    label="Minimum Order Quantity"
                    type="number"
                    placeholder="50"
                    value={formData.minOrder ?? ''}
                    onChange={e => setFormData((f) => ({ ...f, minOrder: e.target.value }))}
                  />
                  <div className="flex gap-3">
                    <Input
                      label="Listing Expires"
                      type="date"
                      className="flex-1"
                      value={formData.expiresAt ?? ''}
                      onChange={e => setFormData((f) => ({ ...f, expiresAt: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Location & Logistics</h2>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        label="City *"
                        placeholder="Detroit"
                        value={formData.city ?? ''}
                        onChange={e => setFormData((f) => ({ ...f, city: e.target.value }))}
                      />
                      <FieldError msg={errors.city} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">State *</label>
                      <select
                        value={formData.state ?? ''}
                        onChange={e => setFormData((f) => ({ ...f, state: e.target.value }))}
                        className="h-9 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
                      >
                        <option value="">State</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <FieldError msg={errors.state} />
                    </div>
                    <Input
                      label="ZIP"
                      placeholder="48201"
                      className="w-24"
                      value={formData.zip ?? ''}
                      onChange={e => setFormData((f) => ({ ...f, zip: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pickup} onChange={e => setPickup(e.target.checked)} className="accent-[var(--accent)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Pickup available at location</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)} className="accent-[var(--accent)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Delivery available</span>
                    </label>
                    {delivery && (
                      <Input
                        label="Delivery Radius (miles)"
                        type="number"
                        placeholder="250"
                        value={formData.deliveryRadius ?? ''}
                        onChange={e => setFormData((f) => ({ ...f, deliveryRadius: e.target.value }))}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Photos & Description */}
              {step === 4 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Photos & Description</h2>
                  <div
                    className="border-2 border-dashed rounded flex flex-col items-center justify-center py-12 gap-3 cursor-pointer hover:border-[var(--border-accent)] transition-colors"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
                  >
                    <Upload size={32} className="text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Drop photos here or click to browse</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Up to 12 photos · JPG, PNG, WEBP</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
                    <textarea
                      rows={6}
                      placeholder="Describe the material, its history, current condition, any certifications, and any relevant details buyers should know..."
                      className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 py-2 resize-none focus:border-[var(--accent)] focus:outline-none"
                      value={formData.description ?? ''}
                      onChange={e => setFormData((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Review & Submit</h2>
                  <div className="p-4 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        ['Listing Type', listingType || '—'],
                        ['Category', category ? CATEGORY_LABELS[category as MaterialCategory] : '—'],
                        ['Title', formData.title || '—'],
                        ['Condition', condition || '—'],
                        ['Quantity', formData.quantity ? `${formData.quantity} ${unit}` : '—'],
                        ['Price', formData.price ? `$${formData.price} / ${unit}` : 'On request'],
                        ['Location', formData.city && formData.state ? `${formData.city}, ${formData.state}` : '—'],
                        ['Pickup', pickup ? 'Yes' : 'No'],
                        ['Delivery', delivery ? 'Yes' : 'No'],
                      ].map(([label, value]) => (
                        <>
                          <span key={`l-${label}`} className="text-[var(--text-tertiary)]">{label}:</span>
                          <span key={`v-${label}`} className="text-[var(--text-primary)] truncate">{value}</span>
                        </>
                      ))}
                    </div>
                  </div>

                  {submitError && (
                    <div
                      className="flex items-center gap-2 p-3 rounded text-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                    >
                      <AlertCircle size={14} />
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" onClick={prev} disabled={step === 0}>
              <ChevronLeft size={16} /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={next}>
                Next <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <><Check size={16} /> Submit Listing</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
