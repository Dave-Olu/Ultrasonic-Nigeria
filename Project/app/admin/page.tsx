'use client';

import { useEffect, useState } from 'react';

type SiteItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  createdAt: string;
};

const initialForm = {
  title: '',
  description: '',
  category: 'General',
  section: 'services',
};

export default function AdminPage() {
  const [items, setItems] = useState<SiteItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      const response = await fetch('/api/site-content');
      const data = await response.json();
      setItems([...(data.services ?? []), ...(data.projects ?? [])]);
    };

    loadItems();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('section', form.section);
      if (file) formData.append('image', file);

      const response = await fetch('/api/site-content', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setStatus('Content uploaded successfully.');
      setForm(initialForm);
      setFile(null);
      const updated = [...items, data.item];
      setItems(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload content.';
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Admin dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">Upload content and images</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Add new services, projects, and marketing information that will be shown on the public website.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Section</label>
              <select
                value={form.section}
                onChange={(event) => setForm({ ...form, section: event.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
              >
                <option value="services">Services</option>
                <option value="projects">Projects</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                placeholder="Solar Panel Installation"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Category</label>
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                placeholder="Installation"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={5}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                placeholder="Tell visitors about this service or project."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-dashed border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:font-semibold file:text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Uploading...' : 'Save content'}
            </button>

            {status && <p className="text-sm text-emerald-300">{status}</p>}
          </form>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">Recent uploads</h2>
            <div className="mt-5 space-y-4">
              {items.length === 0 ? (
                <p className="text-slate-400">No content added yet.</p>
              ) : (
                items.slice(-6).reverse().map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="h-28 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{item.category}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
