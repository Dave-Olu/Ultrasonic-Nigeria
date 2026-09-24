import { getSiteContent } from '../lib/site-data';
import { SiteHomePage } from '../components/site-home';

export default async function HomePage() {
  const content = await getSiteContent();

  return <SiteHomePage content={content} />;
}
