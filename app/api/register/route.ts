import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'register-post', { limit: 5, windowMs: 300000 })
  if (limited) return limited

  try {
    const { name, email, password, company, businessType } = await request.json()

    if (!name || !email || !password || !company) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)

    // Create company slug from name
    const slug = company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 6)

    const newCompany = await prisma.company.create({
      data: {
        name: company,
        slug,
        businessType: businessType ?? 'TRADER',
        email,
        city: '',
        state: '',
        country: 'US',
      },
    })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        companyId: newCompany.id,
      },
    })

    return Response.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
