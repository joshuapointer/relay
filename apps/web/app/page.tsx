import { BrandLogo } from '@relay/ui-core';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '📦',
    title: 'All carriers, one place',
    body: 'USPS, UPS, FedEx, DHL, and more — track every package from a single dashboard.',
  },
  {
    icon: '⚡',
    title: 'Real-time updates',
    body: 'Instant status changes via EasyPost webhooks. No manual refreshing needed.',
  },
  {
    icon: '🔗',
    title: 'Share tracking links',
    body: 'Generate a secure, expiring share link so others can follow along without an account.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header
        className="flex h-14 items-center justify-between px-6 shadow-card"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <BrandLogo variant="light" height={28} />
        <Link
          href="/sign-in"
          className="rounded-md bg-white/20 px-4 py-1.5 font-body text-sm font-medium text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main id="main-content">
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="mb-3 font-body text-sm font-medium uppercase tracking-widest text-secondary">
            Trusted Clarity
          </p>
          <h1 className="font-heading mb-4 max-w-2xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
            All your shipments,
            <br />
            <span style={{ color: 'var(--color-primary)' }}>always in the clear.</span>
          </h1>
          <p className="font-body mb-8 max-w-lg text-lg text-textMuted">
            Relay tracks packages across every major carrier and pushes you live updates —
            so you always know exactly where your stuff is.
          </p>
          <Link
            href="/sign-in"
            className="rounded-md px-8 py-3 font-body text-base font-semibold text-white shadow-card transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Get started — it&apos;s free
          </Link>
        </section>

        {/* Features */}
        <section
          className="px-4 py-16"
          style={{ backgroundColor: 'var(--color-neutral)' }}
          aria-label="Features"
        >
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-surface p-6 shadow-card"
              >
                <span className="mb-3 block text-3xl">{f.icon}</span>
                <h2 className="font-heading mb-2 text-base font-semibold text-ink">
                  {f.title}
                </h2>
                <p className="font-body text-sm text-textMuted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section className="flex flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Ready to get started?
          </h2>
          <Link
            href="/sign-in"
            className="rounded-md px-8 py-3 font-body text-base font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Sign in with your account
          </Link>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="font-body text-xs text-textMuted">
          © {new Date().getFullYear()} Relay. Built with Trusted Clarity.
        </p>
      </footer>
    </div>
  );
}
