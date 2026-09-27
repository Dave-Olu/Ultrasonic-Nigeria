import { promises as fs } from 'fs';
import path from 'path';

export type SiteStat = {
  label: string;
  value: number;
};

export type SiteItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  createdAt: string;
};

export type SiteProduct = {
  name: string;
  images: string[];
};

export type SiteContact = {
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  officeAddress: string;
};

export type SiteContent = {
  hero: {
    title: string;
    subtitle: string;
    phone: string;
    cta: string;
  };
  contact: SiteContact;
  stats: SiteStat[];
  services: SiteItem[];
  projects: SiteItem[];
  products: SiteProduct[];
};

const DATA_FILE = path.join(process.cwd(), 'data', 'site-content.json');

const fallbackContent: SiteContent = {
  hero: {
    title: 'Powering homes and businesses with solar, across Nigeria.',
    subtitle:
      'Affordable, reliable, and clean power systems for homes, offices, farms, and commercial projects.',
    phone: '+2349067690379',
    cta: 'Request a quote',
  },
  contact: {
    primaryPhone: '+2349067690379',
    secondaryPhone: '+2349050033209',
    email: 'uwen94@gmail.com',
    officeAddress: 'Block 195, Fatima Gold Estate, Mararaba, Nasarawa State',
  },
  stats: [
    { label: 'Projects executed', value: 50 },
    { label: 'Customers served', value: 100 },
    { label: 'Locations covered', value: 6 },
  ],
  services: [
    {
      id: 'default-1',
      title: 'Solar Panel Installation',
      description: 'Design and installation of residential and commercial solar arrays.',
      image: '/Images/panel.jpg',
      category: 'Installation',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-2',
      title: 'Inverter Installation',
      description: 'Hybrid and backup inverter systems tailored to your power demand.',
      image: '/Images/Inverter.jpg',
      category: 'Inverter',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-3',
      title: 'Battery & Charge Controller',
      description: 'Energy storage and charge control for dependable, long-term performance.',
      image: '/Images/IMG-20260921-WA0034.jpg',
      category: 'Power Storage',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-4',
      title: 'System Maintenance',
      description: 'Repairs, checks, and upgrades to keep your system working efficiently.',
      image: '/Images/IMG-20260921-WA0028.jpg',
      category: 'Maintenance',
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: 'default-project-1',
      title: 'Home Solar Upgrade',
      description: '12kW hybrid power solution installed to improve efficiency and reliability.',
      image: '/Images/work_photo.jpg',
      category: 'Residential',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-project-2',
      title: 'Commercial Power System',
      description: 'Stable energy support for a business environment with long-running loads.',
      image: '/Images/IMG-20260921-WA0033.jpg',
      category: 'Commercial',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-project-3',
      title: 'Farm Energy Setup',
      description: 'Power for irrigation and daily pumping operations with strong backup storage.',
      image: '/Images/solar array.jpg',
      category: 'Agriculture',
      createdAt: new Date().toISOString(),
    },
  ],
  products: [
    { name: 'Deye', images: ['/Images/Inverter.jpg', '/Images/panel.jpg', '/Images/IMG-20260921-WA0034.jpg'] },
    { name: 'Cworth', images: ['/Images/IMG-20260921-WA0033.jpg', '/Images/solar array.jpg', '/Images/work_photo.jpg'] },
    { name: 'LVTOPSUN', images: ['/Images/panel.jpg', '/Images/IMG-20260921-WA0028.jpg', '/Images/Inverter.jpg'] },
    { name: 'Jinko', images: ['/Images/solar array.jpg', '/Images/panel.jpg', '/Images/IMG-20260921-WA0034.jpg'] },
    { name: 'JA Solar', images: ['/Images/work_photo.jpg', '/Images/solar array.jpg', '/Images/panel.jpg'] },
    { name: 'Longi', images: ['/Images/panel.jpg', '/Images/IMG-20260921-WA0033.jpg', '/Images/solar array.jpg'] },
    { name: 'Felicity', images: ['/Images/Inverter.jpg', '/Images/IMG-20260921-WA0029.jpg', '/Images/IMG-20260921-WA0034.jpg'] },
    { name: 'SNRE', images: ['/Images/IMG-20260921-WA0028.jpg', '/Images/work_photo.jpg', '/Images/Inverter.jpg'] },
  ],
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const file = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(file) as Partial<SiteContent>;

    return {
      hero: { ...fallbackContent.hero, ...parsed.hero },
      contact: { ...fallbackContent.contact, ...parsed.contact, primaryPhone: parsed.contact?.primaryPhone ?? parsed.hero?.phone ?? fallbackContent.contact.primaryPhone },
      stats: parsed.stats?.length ? parsed.stats : fallbackContent.stats,
      services: parsed.services?.length ? parsed.services : fallbackContent.services,
      projects: parsed.projects?.length ? parsed.projects : fallbackContent.projects,
      products: parsed.products?.length ? parsed.products : fallbackContent.products,
    };
  } catch {
    return fallbackContent;
  }
}

export async function saveSiteContent(nextContent: Partial<SiteContent>) {
  const existing = await getSiteContent();
  const merged = {
    ...existing,
    ...nextContent,
    hero: { ...existing.hero, ...nextContent.hero },
    contact: { ...existing.contact, ...nextContent.contact },
    stats: nextContent.stats ?? existing.stats,
    services: nextContent.services ?? existing.services,
    projects: nextContent.projects ?? existing.projects,
    products: nextContent.products ?? existing.products,
  };

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(merged, null, 2), 'utf8');

  return merged;
}
