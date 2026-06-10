import { Navbar } from '@/components/navigation/Navbar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ShieldCheck } from 'lucide-react'

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
]

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-lg mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Settings</h1>

          <div className="flex gap-8 flex-col md:flex-row">
            {/* Sidebar */}
            <nav className="md:w-48 shrink-0">
              <div className="flex flex-col gap-1">
                {SECTIONS.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="px-3 py-2 text-sm rounded transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Profile */}
              <section
                id="profile"
                className="p-6 rounded flex flex-col gap-5"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <h2 className="font-semibold text-[var(--text-primary)]">Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" placeholder="John Smith" />
                  <Input label="Email" type="email" placeholder="john@company.com" />
                  <Input label="Phone" type="tel" placeholder="+1 555 000 0000" />
                  <Input label="Title" placeholder="Operations Manager" />
                </div>
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </section>

              {/* Company */}
              <section
                id="company"
                className="p-6 rounded flex flex-col gap-5"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[var(--text-primary)]">Company</h2>
                  <Badge variant="amber">Verification Pending</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Company Name" placeholder="Acme Scrap Metals LLC" />
                  <Input label="EIN" placeholder="XX-XXXXXXX" />
                  <Input label="License Number" placeholder="Optional" />
                  <Input label="Website" type="url" placeholder="https://yourcompany.com" />
                  <Input label="City" placeholder="Detroit" />
                  <Input label="State" placeholder="MI" />
                  <Input label="Phone" type="tel" placeholder="+1 555 000 0000" />
                  <Input label="Business Email" type="email" placeholder="info@company.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your business operations, specialties, and years in the industry…"
                    className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 py-2 resize-none focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                {/* Verification CTA */}
                <div
                  className="flex items-start gap-3 p-4 rounded"
                  style={{ background: 'var(--accent-glow)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <ShieldCheck size={20} className="text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--accent)]">Get Verified</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Verified companies get 3× more inquiries. Submit your business license and EIN to get verified.
                    </p>
                  </div>
                  <Button size="sm">Apply Now</Button>
                </div>

                <div className="flex justify-end">
                  <Button>Save Company</Button>
                </div>
              </section>

              {/* Notifications */}
              <section
                id="notifications"
                className="p-6 rounded flex flex-col gap-4"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <h2 className="font-semibold text-[var(--text-primary)]">Notifications</h2>
                {[
                  { label: 'New inquiry on my listings', desc: 'Get emailed when someone sends an inquiry' },
                  { label: 'Saved search alerts', desc: 'Daily digest of new listings matching saved searches' },
                  { label: 'Listing expiry reminders', desc: '7 days before a listing expires' },
                  { label: 'Platform announcements', desc: 'New features and marketplace news' },
                ].map(({ label, desc }) => (
                  <label key={label} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--accent)] mt-0.5 w-4 h-4" />
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{label}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{desc}</p>
                    </div>
                  </label>
                ))}
                <div className="flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </section>

              {/* Security */}
              <section
                id="security"
                className="p-6 rounded flex flex-col gap-5"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <h2 className="font-semibold text-[var(--text-primary)]">Security</h2>
                <Input label="Current Password" type="password" placeholder="••••••••" />
                <Input label="New Password" type="password" placeholder="At least 8 characters" />
                <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                <div className="flex justify-end">
                  <Button>Update Password</Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
