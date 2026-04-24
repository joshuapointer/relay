import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import TopNav from '@/components/TopNav';
import { RealtimeProvider } from '@/lib/realtime';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <RealtimeProvider>
        <main className="flex-1">{children}</main>
      </RealtimeProvider>
    </div>
  );
}
