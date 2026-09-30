'use client';

import { useState } from 'react';

type FAQItem = {
  question: string;
  answer: string;
  bullets?: string[];
};

const faqs: FAQItem[] = [
  {
    question: 'What appliances can a solar power system run in my home or office?',
    answer:
      'Depending on your selected system capacity (from 1kVA starter kits up to 20kVA+ commercial systems), our solar setups can power both light and heavy appliances:',
    bullets: [
      'Basic loads: LED lights, fans, televisions, decoders, laptops, sound systems, and CCTV.',
      'Medium loads: Refrigerators, freezers, washing machines, and blender/kitchen gadgets.',
      'Heavy inductive loads: Inverter air conditioners (1HP, 1.5HP, 2HP+), water borehole pumping machines, and workshop equipment.',
    ],
  },
  {
    question: 'How do I know the right system size for my energy needs?',
    answer:
      'System sizing depends on three key factors: the total wattage of appliances you plan to run simultaneously, how many hours of battery backup you need at night, and whether you want a grid-tied, hybrid, or 100% off-grid setup. You can reach out directly on WhatsApp with your appliance list, and our engineers will provide a free load calculation and customized proposal.',
  },
  {
    question: 'Do you carry out installations outside Nasarawa State and Abuja?',
    answer:
      'Yes! While our head office is located at Fatima Gold Estate, Mararaba (Nasarawa State), our field engineering team travels and executes residential, agricultural, and commercial solar projects across Abuja (FCT), Niger, Benue, Kogi, Plateau, Cross River, and nationwide across Nigeria.',
  },
  {
    question: 'What equipment brands do you supply and install?',
    answer:
      'We only supply and install authentic equipment from tier-1, globally recognized manufacturers. Our primary inverter and battery partners include Deye, Felicity Solar, LVTOPSUN, and SNRE. For solar panels, we supply high-efficiency monocrystalline modules from Jinko Solar, Longi, JA Solar, and Cworth.',
  },
  {
    question: 'What is the difference between lithium batteries and tubular gel batteries?',
    answer:
      'Lithium-ion (LiFePO4) batteries represent the gold standard in modern energy storage. They last 10–15 years (4,000–6,000 charge cycles), charge 3x faster, allow up to 90–95% depth of discharge without degrading, and require zero maintenance. Tubular and deep-cycle gel batteries have a lower upfront cost with a 3–5 year lifespan, making them a budget-friendly option for smaller starter backup systems.',
  },
  {
    question: 'Can I start small and expand my solar system in the future?',
    answer:
      'Yes, scalability is central to our engineering designs. You can start with an essential hybrid inverter and battery setup to eliminate blackouts, then add solar panels or extra battery storage over time as your energy demands increase without needing to replace your main inverter.',
  },
  {
    question: 'Do you offer maintenance, diagnostics, and repairs for existing setups?',
    answer:
      'Yes. Even if your solar system was installed by another vendor, our technicians provide complete diagnostic checks, inverter repairs, battery health testing, solar panel re-alignment/cleaning, charge controller tuning, and system revamps to restore optimal performance.',
  },
  {
    question: 'What warranties and after-sales support do you provide?',
    answer:
      'Every installation is covered by official manufacturer warranties—up to 25 years on tier-1 solar panel linear performance, and 5 to 10 years on lithium batteries and hybrid inverters. In addition, Ultrasonic provides a workmanship guarantee on all wiring and mounting, with prompt after-sales technical support whenever you need assistance.',
  },
];

function FAQAccordionItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const headingId = `faq-heading-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div className="border-b border-slate-200 transition-colors dark:border-slate-800">
      <button
        id={headingId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:hover:text-emerald-300"
      >
        <span className="font-display text-lg font-bold tracking-wide text-brand-900 dark:text-sky-100 sm:text-xl">
          {item.question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-transform duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${
            isOpen ? 'rotate-180 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' : ''
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={headingId} className="pb-6 pr-6 text-slate-600 dark:text-slate-300">
          <p className="text-base leading-relaxed">{item.answer}</p>
          {item.bullets && item.bullets.length > 0 && (
            <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {item.bullets.map((bullet, i) => (
                <li key={i} className="list-disc">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function FAQSection({ phone }: { phone?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  const whatsappHref = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Ultrasonic, I have a question about your solar installation services.')}`
    : '#contact';

  return (
    <section id="faq" className="bg-white py-20 transition-colors dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Frequently Asked Questions
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-brand-900 dark:text-white sm:text-4xl lg:text-5xl">
            Everything you need to know about going solar.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Clear, straightforward answers about system sizing, battery technology, equipment warranties, and installation across Nigeria.
          </p>
        </div>

        <div className="mt-12 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950 sm:p-10">
          {faqs.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              item={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => toggleIndex(index)}
            />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center dark:bg-emerald-950/30 sm:flex sm:items-center sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-xl font-bold text-brand-900 dark:text-white">
              Have a specific question about your site or energy bill?
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Speak directly with an engineer for a free energy assessment and quote.
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 sm:mt-0 sm:shrink-0"
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
