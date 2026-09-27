import { SiteHeader, ServicesSection, Footer } from '@/components/site-home';
import { getSiteContent } from '@/lib/site-data';

export default async function ServicesPage() {
  const content = await getSiteContent();

  return (
    <main className="bg-slate-100 text-slate-900">
      <SiteHeader phone={content.hero.phone} />
      <ServicesSection services={content.services} />
      <Footer phone={content.hero.phone} contact={content.contact} />
    </main>
  );
}
