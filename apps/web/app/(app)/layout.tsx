import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';

import TopNav from '@/components/TopNav';
import { authOptions } from '@/lib/auth';
import { RealtimeProvider } from '@/lib/realtime';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
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
