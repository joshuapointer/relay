import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        {/* Wordmark */}
        <h1 className="font-heading text-4xl font-bold text-primary">Relay</h1>

        {/* Tagline */}
        <p className="font-body text-lg text-ink">
          Shipment tracking built on Trusted Clarity.
        </p>

        <p className="font-body text-textMuted max-w-md text-base">
          Get real-time carrier updates for every package — all in one place,
          with the transparency you deserve.
        </p>

        {/* CTA */}
        <Link
          href="/sign-in"
          className="bg-primary text-white hover:bg-primary/90 font-body rounded-md px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
