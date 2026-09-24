import { SiteHeader, ProductsSection, Footer } from '@/components/site-home';
import { getSiteContent } from '@/lib/site-data';

export default async function ProductsPage() {
  const content = await getSiteContent();

  return (
    <main className="bg-slate-100 text-slate-900">
      <SiteHeader phone={content.hero.phone} />
      <ProductsSection brands={content.brands} />
      <Footer />
    </main>
  );
}
