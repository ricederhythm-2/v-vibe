import AppHeader from '@/components/AppHeader';
import AgencyContent from '@/components/AgencyContent';

export const dynamic = 'force-dynamic';

export default function AgencyPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <AppHeader showBack />
      <main>
        <AgencyContent slug={params.slug} />
      </main>
    </div>
  );
}
