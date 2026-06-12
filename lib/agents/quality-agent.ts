// Listing Quality Agent — scores listing completeness 0-100 and suggests
// concrete improvements. Runs synchronously on create/update; the score is
// persisted on Listing.qualityScore and powers search ranking boosts.

export interface QualityInput {
  title?: string | null
  description?: string | null
  specs?: string | null
  grade?: string | null
  materialSubcategory?: string | null
  pricePerUnit?: number | null
  minOrder?: number | null
  photos?: string[] | null
  location?: string | null
  expiresAt?: Date | string | null
}

export interface QualityResult {
  score: number
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  suggestions: string[]
}

interface Rule {
  points: number
  passes: (l: QualityInput) => boolean
  suggestion: string
}

const RULES: Rule[] = [
  {
    points: 15,
    passes: (l) => (l.title?.trim().length ?? 0) >= 20,
    suggestion: 'Use a descriptive title of at least 20 characters (material, grade, quantity).',
  },
  {
    points: 20,
    passes: (l) => (l.description?.trim().length ?? 0) >= 80,
    suggestion: 'Add a detailed description (80+ characters) — listings with full descriptions get 3x more inquiries.',
  },
  {
    points: 15,
    passes: (l) => (l.photos?.length ?? 0) >= 1,
    suggestion: 'Add at least one photo — buyers skip listings without images.',
  },
  {
    points: 5,
    passes: (l) => (l.photos?.length ?? 0) >= 3,
    suggestion: 'Add 3+ photos from different angles to build buyer confidence.',
  },
  {
    points: 15,
    passes: (l) => Boolean(l.grade?.trim()),
    suggestion: 'Specify the material grade (e.g., HMS 1&2, 304 stainless) so buyers can match specs.',
  },
  {
    points: 10,
    passes: (l) => Boolean(l.pricePerUnit && l.pricePerUnit > 0),
    suggestion: 'Set a price per unit — "price on request" listings convert poorly.',
  },
  {
    points: 5,
    passes: (l) => Boolean(l.minOrder && l.minOrder > 0),
    suggestion: 'Set a minimum order quantity to filter out unqualified inquiries.',
  },
  {
    points: 5,
    passes: (l) => Boolean(l.materialSubcategory?.trim()),
    suggestion: 'Pick a subcategory to appear in narrower searches.',
  },
  {
    points: 5,
    passes: (l) => Boolean(l.specs?.trim()),
    suggestion: 'Add technical specs (dimensions, composition, certifications).',
  },
  {
    points: 5,
    passes: (l) => Boolean(l.location?.trim()),
    suggestion: 'Add a precise pickup location for freight estimation.',
  },
]

export function scoreListing(listing: QualityInput): QualityResult {
  let score = 0
  const suggestions: string[] = []

  for (const rule of RULES) {
    if (rule.passes(listing)) {
      score += rule.points
    } else {
      suggestions.push(rule.suggestion)
    }
  }

  const grade =
    score >= 85 ? 'EXCELLENT' : score >= 65 ? 'GOOD' : score >= 40 ? 'FAIR' : 'POOR'

  return { score, grade, suggestions }
}
