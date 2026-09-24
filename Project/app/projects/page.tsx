import { SiteHeader, ProjectsSection, Footer } from '@/components/site-home';
import { getSiteContent } from '@/lib/site-data';

export default async function ProjectsPage() {
  const content = await getSiteContent();

  return (
    <main className="bg-slate-100 text-slate-900">
      <SiteHeader phone={content.hero.phone} />
      <ProjectsSection projects={content.projects} />
      <Footer />
    </main>
  );
}
