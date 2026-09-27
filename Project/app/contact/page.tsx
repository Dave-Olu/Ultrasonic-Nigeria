import { SiteHeader, ContactSection, Footer } from '@/components/site-home';
import { getSiteContent } from '@/lib/site-data';

export default async function ContactPage() {
  const content = await getSiteContent();

  return (
    <main className="bg-slate-100 text-slate-900">
      <SiteHeader phone={content.hero.phone} />
      <ContactSection phone={content.hero.phone} contact={content.contact} />
      <Footer phone={content.hero.phone} contact={content.contact} />
    </main>
  );
}
