import { SiteHeader, AboutSection, Footer } from '@/components/site-home';
import { getSiteContent } from '@/lib/site-data';

export default async function AboutPage() {
  const content = await getSiteContent();

  return (
    <main className="bg-slate-100 text-slate-900">
      <SiteHeader phone={content.hero.phone} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AboutSection />
      </div>
      <Footer phone={content.hero.phone} contact={content.contact} />
    </main>
  );
}
