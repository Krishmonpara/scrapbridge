import { FrameAnimationHero } from '@/components/hero/FrameAnimationHero'

// Splash route — the explosion animation is the first thing every visitor sees.
// After clicking "Start Scraping", a sessionStorage flag is set so the splash
// won't reappear on subsequent navigations within the same tab session.
export default function SplashPage() {
  return <FrameAnimationHero ctaHref="/home" storageKey="sb-splash-seen" />
}
