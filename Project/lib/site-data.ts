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

export type SiteContent = {
  hero: {
    title: string;
    subtitle: string;
    phone: string;
    cta: string;
  };
  stats: SiteStat[];
  services: SiteItem[];
  projects: SiteItem[];
  brands: string[];
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
  brands: ['Deye', 'Cworth', 'LVTOPSUN', 'Jinko', 'JA Solar', 'Longi', 'Felicity', 'SNRE'],
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const file = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(file) as Partial<SiteContent>;

    return {
      hero: { ...fallbackContent.hero, ...parsed.hero },
      stats: parsed.stats?.length ? parsed.stats : fallbackContent.stats,
      services: parsed.services?.length ? parsed.services : fallbackContent.services,
      projects: parsed.projects?.length ? parsed.projects : fallbackContent.projects,
      brands: parsed.brands?.length ? parsed.brands : fallbackContent.brands,
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
    stats: nextContent.stats ?? existing.stats,
    services: nextContent.services ?? existing.services,
    projects: nextContent.projects ?? existing.projects,
    brands: nextContent.brands ?? existing.brands,
  };

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(merged, null, 2), 'utf8');

  return merged;
}
