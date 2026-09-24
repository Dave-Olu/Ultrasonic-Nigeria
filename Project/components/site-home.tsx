"use client";

import Link from 'next/link';
import { useState } from 'react';
import type { SiteContent } from '@/lib/site-data';

const navItems = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Products', href: '/products' },
  { label: 'Contact', href: '/contact' },
];

export function SiteHeader({ phone }: { phone: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img src="/Images/logo.jpg" alt="Ultrasonic logo" className="h-11 w-11 rounded-full object-cover" />
          <div>
            <p className="font-display text-lg font-extrabold uppercase tracking-[0.08em] text-brand-900">Ultrasonic</p>
            <p className="text-[11px] text-slate-500">Power Line Venture</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-brand-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/admin" className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-900 hover:text-brand-900">
            Admin
          </Link>
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-emerald-400">
            Get a Quote
          </a>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-300 p-2 text-slate-700 md:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-2 py-2 transition hover:bg-slate-100 hover:text-brand-900"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin" onClick={() => setIsOpen(false)} className="rounded-md border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">
              Admin
            </Link>
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="rounded-md bg-emerald-500 px-3 py-2 text-center font-bold text-slate-900">
              Get a Quote
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function HeroSection({ hero }: { hero: SiteContent['hero'] }) {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <img src="/Images/work_photo.jpg" alt="Solar installation" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-sky-950/80" />
      <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="mb-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Renewable energy specialists</p>
        <h1 className="font-display text-4xl font-extrabold leading-none text-white sm:text-5xl lg:text-7xl">
          {hero.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200">{hero.subtitle}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={`tel:${hero.phone.replace(/\s+/g, '')}`} className="rounded-md bg-[#F2A93B] px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500">
            Call {hero.phone}
          </a>
          <Link href="/products" className="rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20">
            See brands
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <img src="/Images/work_photo.jpg" alt="Team at work" className="h-full w-full rounded-3xl object-cover shadow-soft" />
        <div>
          <p className="mb-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">About us</p>
          <h2 className="font-display text-4xl font-extrabold text-brand-900">Solar power you can count on.</h2>
          <div className="mt-6 space-y-4 text-lg text-slate-600">
            <p>Ultrasonic Power Line Venture is a registered renewable energy company helping homes, offices, farms, and businesses switch to clean, affordable solar systems.</p>
            <p>We design, install, maintain, and support solar panels, batteries, inverters, charge controllers, and backup systems across Nigeria.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection({ stats }: { stats: SiteContent['stats'] }) {
  return (
    <section className="bg-brand-900 py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="font-display text-5xl font-extrabold text-[#F2A93B]">{stat.value}+</p>
              <p className="mt-2 text-sm uppercase tracking-[0.12em] text-sky-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServicesSection({ services }: { services: SiteContent['services'] }) {
  return (
    <section id="services" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Services offered</p>
          <h2 className="font-display text-4xl font-extrabold text-brand-900">Full-service solar, start to finish.</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article key={service.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <img src={service.image} alt={service.title} className="h-52 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{service.category}</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-brand-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectsSection({ projects }: { projects: SiteContent['projects'] }) {
  return (
    <section id="projects" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="mb-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Recent projects</p>
          <h2 className="font-display text-4xl font-extrabold text-brand-900">Projects that keep communities and businesses powered.</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <img src={project.image} alt={project.title} className="h-52 w-full object-cover" />
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{project.category}</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-brand-900">{project.title}</h3>
                <p className="mt-3 text-slate-600">{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductsSection({ brands }: { brands: SiteContent['brands'] }) {
  return (
    <section id="products" className="bg-slate-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Products we sell</p>
          <h2 className="font-display text-4xl font-extrabold text-brand-900">Trusted brands, in stock.</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {brands.map((brand) => (
            <span key={brand} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:border-brand-900 hover:text-brand-900">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ phone }: { phone: string }) {
  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Get in touch</p>
            <h2 className="font-display text-4xl font-extrabold text-brand-900">Request a quote today.</h2>
            <div className="mt-8 space-y-5 text-slate-700">
              <div><span className="font-bold text-slate-900">Phone:</span> 0906 769 0379 / 0905 003 3209</div>
              <div><span className="font-bold text-slate-900">Email:</span> uwen94@gmail.com</div>
              <div><span className="font-bold text-slate-900">Address:</span> Block 195, Fatima Gold Estate, Mararaba, Nasarawa State</div>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-900 p-8 text-white shadow-soft">
            <p className="text-lg text-sky-100">Tell us what you need and we will prepare a quote for your site.</p>
            <form className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="text" placeholder="Name" className="rounded-md border-0 px-3 py-2.5 text-slate-900" />
                <input type="tel" placeholder="Phone" className="rounded-md border-0 px-3 py-2.5 text-slate-900" />
              </div>
              <input type="text" placeholder="Location" className="w-full rounded-md border-0 px-3 py-2.5 text-slate-900" />
              <select className="w-full rounded-md border-0 bg-white px-3 py-2.5 text-slate-900">
                <option>Choose a service</option>
                <option>Solar installation</option>
                <option>Battery & inverter</option>
                <option>Maintenance</option>
              </select>
              <textarea rows={4} placeholder="Project details" className="w-full rounded-md border-0 px-3 py-2.5 text-slate-900" />
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="block w-full rounded-md bg-[#F2A93B] px-5 py-3 text-center font-bold text-slate-900 transition hover:bg-yellow-500">
                Send on WhatsApp
              </a>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <span>Ultrasonic Power Line Venture</span>
        <span>Nasarawa State, Nigeria · Founded 2024</span>
      </div>
    </footer>
  );
}

export function SiteHomePage({ content }: { content: SiteContent }) {
  return (
    <main className="bg-slate-100 text-slate-900">
      <SiteHeader phone={content.hero.phone} />
      <HeroSection hero={content.hero} />
      <AboutSection />
      <StatsSection stats={content.stats} />
      <ServicesSection services={content.services} />
      <ProjectsSection projects={content.projects} />
      <ProductsSection brands={content.brands} />
      <ContactSection phone={content.hero.phone} />
      <Footer />
    </main>
  );
}
